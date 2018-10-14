'use strict';

const coinstacCommon = require('coinstac-common');
const fs = require('fs');
const glob = require('glob');
const path = require('path');
const PouchDBAdapterMemory = require('pouchdb-adapter-memory');
const Project = require('coinstac-common').models.Project;
const { promisify } = require('bluebird');
const Storage = require('dom-storage');
const winston = require('winston');
const ProjectService = require('../../src/sub-api/project-service.js');
const CoinstacClient = require('../../src/index.js');

coinstacCommon.services.dbRegistry.DBRegistry.Pouchy.PouchDB.plugin(
  PouchDBAdapterMemory
);

const getSyncedDatabase = coinstacCommon.utils.getSyncedDatabase;

const logger = new winston.Logger({
  level: 'info',
  transports: [new winston.transports.Console()],
});

const STORAGE_DIR = path.join(__dirname, '..', '.tmp');

function getFilesFromDir(dir) {
  const statAsync = promisify(fs.stat);

  return promisify(glob)(dir)
    .then(files => Promise.all(files.map((file) => {
      return statAsync(file).then(stats => ({ file, stats }));
    })))
    .then(results => results.reduce((memo, { file, stats }) => {
      return stats.isFile() ? memo.concat(file) : memo;
    }, []))
    .then(ProjectService.prototype.getFileStats);
}

function getQueueEndStopper(count, fn) {
  let endCount = 0;

  return function queEndStopper(runId) {
    endCount += 1;

    logger.info('queue:end', `runId: ${runId}`, `count: ${endCount}`);

    if (endCount === count) {
      const value = fn();

      /**
       * Ensure process exists.
       *
       * @todo Determine if this is necessary
       */
      if (typeof value === 'object' && value.then && value.catch) {
        value.then(process.exit);
      } else {
        process.exit();
      }
    }
  };
}

function start({
  consortiumId, files, metaFilePath, username,
}) {
  const client = new CoinstacClient({
    appDirectory: STORAGE_DIR,
    db: {
      local: {
        pouchConfig: {
          adapter: 'memory',
        },
      },
      noURLPrefix: true,
      path: path.join(STORAGE_DIR, 'db'),
      remote: {
        db: {
          hostname: 'localhost',
          pathname: '',
          port: 5984,
          protocol: 'http',
        },
        pouchConfig: {
          adapter: 'memory',
        },
      },
    },
    hp: 'http://localhost:8800',
    logger,
    storage: new Storage(null, { strict: true }),
  });

  logger.info('Initializing client...');

  return client.initialize({
    password: 'test',
    username,
  })
    .then(() => {
      logger.info('Client initialized');

      client.pool.events.on(
        'queue:end',
        getQueueEndStopper(6, client.teardown.bind(client))
      );

      return Promise.all([
        getFilesFromDir(files),
        ProjectService.getCSV(metaFilePath),
        getSyncedDatabase(
          client.dbRegistry,
          `remote-consortium-${consortiumId}`
        ),
      ]);
    })
    .then(([files, metaFile, remoteDb]) => {
      logger.info('Saving project...');

      return Promise.all([
        client.dbRegistry.get('projects').save(
          new Project({
            consortiumId,
            files,
            metaCovariateMapping: {
              1: 0,
              2: 1,
            },
            metaFile: JSON.parse(metaFile),
            metaFilePath,
            name: 'test-project',
          }).serialize()
        ),
        remoteDb.all(),
      ]);
    })
    .then(([project, remoteDocs]) => {
      logger.info('Starting computation...');

      if (!remoteDocs.length) {
        throw new Error('No remote docs!');
      }

      return client.computations.joinRun({
        consortiumId,
        projectId: project._id,
        runId: remoteDocs[0]._id,
      });
    });
}

function getMessageSender(message) {
  return function messageSender(data) {
    const toSend = {
      data,
      response: message.command,
    };

    logger.info('Sending IPC message:', toSend);
    process.send(toSend);
  };
}

process.on('uncaughtException', (error) => {
  logger.error(error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, p) => {
  logger.error('Unhandled Rejection at: Promise ', p, ' reason: ', reason);
  process.exit(1);
});

process.on('message', (message) => {
  const messageSender = getMessageSender(message);
  const { command, data } = message;

  logger.info('Received IPC message:', message);

  switch (command) {
    case 'READY':
      return messageSender();
    case 'START':
      return start(data).then(messageSender);
    default:
      return messageSender('UNKNOWN COMMAND');
  }
});
