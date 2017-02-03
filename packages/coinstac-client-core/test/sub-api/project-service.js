'use strict';

const clientFactory = require('../utils/client-factory');
const cloneDeep = require('lodash/cloneDeep');
const coinstacCommon = require('coinstac-common');
const EventEmitter = require('events');
const fs = require('fs');
const fileStats = require('../../src/utils/file-stats');
const noop = require('lodash/noop');
const path = require('path');
const projectFactory = require('../utils/project-factory');
const ProjectService = require('../../src/sub-api/project-service');
const sinon = require('sinon');
const test = require('tape');

function getNextTick(callback) {
  return new Promise((resolve, reject) => {
    process.nextTick(() => {
      try {
        callback();
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}

test('ProjectService#getCSV', t => {
  const readFileStub = sinon.stub(fs, 'readFile');
  const filename = './path/to/random.csv';
  const data = [
    ['filename', 'random', 'column'],
    ['./M100.txt', '44', 'true'],
    ['./M101.txt', '18', 'false'],
    ['./M102.txt', '65', 'true'],
  ];
  readFileStub.yields(null, new Buffer(data.map(r => r.join(',')).join('\n')));

  t.plan(2);

  ProjectService.prototype.getCSV(filename)
    .then(csvString => {
      t.ok(
        readFileStub.calledWith(filename),
        'reads file via passed arg'
      );
      t.deepEqual(
        JSON.parse(csvString),
        data,
        'parses and returns CSV string'
      );
    })
    .then(readFileStub.restore, readFileStub.restore)
    .catch(t.end);
});

test('ProjectService#setMetaContents errors', t => {
  const consortiumId = 'test-consortium';
  const projectId = 'test-project';

  const dbGetSpy = sinon.spy();

  // Sinon doesn't support dynamic stub responses based on args. Do it manually.
  function dbGetStub(name) {
    let doc;

    if (name === 'computations') {
      doc = {
        inputs: dbGetSpy.callCount <= 1 ?
          [[]] :
        [[
          'wat',
          'wat',
          {
            type: 'covariates',
          },
        ]],
      };
    } else {
      doc = {
        _id: consortiumId,
        activeComputationInputs: dbGetSpy.callCount <= 2 ?
          [['wat', 'wat', 'wat']] :
        [[
          'wat',
          'wat',
          [{
            name: 'Is Control',
            type: 'boolean',
          }],
        ]],
      };
    }

    return {
      get(...args) {
        dbGetSpy.apply(dbGetSpy, args);
        return Promise.resolve(doc);
      },
    };
  }

  const project = {
    dbRegistry: {
      get: dbGetStub,
    },
    get: sinon.stub(),
  };

  const setMetaContents = ProjectService.prototype.setMetaContents.bind(
    project
  );
  const badFiles = [{
    filename: path.join(__dirname, 'baddies.txt'),
    tags: {},
  }];
  const files = [{
    filename: path.join(__dirname, 'M100.txt'),
    tags: {},
  }, {
    filename: path.join(__dirname, 'M101.txt'),
    tags: {},
  }];
  const metaFile = [
    ['filename', 'age', 'is control'],
    ['./M100.txt', '30', 'true'],
    ['./M101.txt', '29', 'false'],
    ['./M102.txt', '28', 'true'],
  ];
  const metaFilePath = path.join(__dirname, 'metadata.csv');

  project.get.returns(Promise.resolve({
    _id: projectId,
    consortiumId,
    files,
    metaFile: [
      ['filename', 'bogus'],
      ['M100.txt', 'stringz'],
    ],
    metaFilePath,
    metaCovariateMapping: {
      0: 1,
    },
  }));
  project.get.onCall(0).returns(Promise.resolve({
    _id: projectId,
  }));
  project.get.onCall(3).returns(Promise.resolve({
    _id: projectId,
    consortiumId,
    files: badFiles,
    metaFile,
    metaFilePath,
  }));
  project.get.onCall(5).returns(Promise.resolve({
    _id: projectId,
    consortiumId,
    files,
    metaCovariateMapping: {
      0: 0,
    },
    metaFile,
    metaFilePath,
  }));

  t.plan(7);

  setMetaContents()
    .catch(error => {
      t.ok(
        /project id/i.test(error.message),
        'Rejects without project ID'
      );

      return setMetaContents(projectId);
    })
    .catch(error => {
      t.ok(
        error.message.indexOf('consortium') > -1,
        'Rejects without project consortium ID'
      );

      return setMetaContents(projectId);
    })
    .catch(error => {
      t.ok(
        error.message.indexOf('covariates index') > -1,
        'Rejects without covariates index'
      );

      return setMetaContents(projectId);
    })
    .catch(error => {
      t.ok(
        error.message.indexOf('covariates') > -1,
        'Rejects without active computation inputs'
      );

      return setMetaContents(projectId);
    })
    .catch(error => {
      t.ok(
        error.message.indexOf('baddies.txt') > -1,
        'Rejects with missing file'
      );

      return setMetaContents(projectId);
    })
    .catch(error => {
      t.ok(
        error.message.indexOf('Is Control') > -1,
        'errors with bad metaFile to covariate mapping'
      );

      return setMetaContents(projectId);
    })
    .catch(error => {
      t.ok(
        error.message.indexOf('determine column value') > -1,
        'errors with bad metaFile column'
      );
    })
    .catch(t.end);
});

test('ProjectService - setMetaContents', t => {
  const consortiumId = 'test-consortium';
  const projectId = 'test-project';
  const filename1 = path.join(__dirname, 'controls', 'M100.txt');
  const filename2 = path.join(__dirname, 'patients', 'M101.txt');
  const filename3 = path.join(__dirname, 'patients', 'M102.txt');

  const dbGetStub = sinon.stub();

  dbGetStub.onCall(0).returns(Promise.resolve({
    _id: consortiumId,
    activeComputationInputs: [[
      0,
      1,
      [{
        name: 'Is Control',
        type: 'boolean',
      }, {
        name: 'Age',
        type: 'number',
      }],
    ]],
  }));
  dbGetStub.onCall(1).returns(Promise.resolve({
    inputs: [[{
      type: 'something',
    }, {
      type: 'whatever',
    }, {
      type: 'covariates',
    }]],
  }));

  const goodProject1 = {
    _id: projectId,
    consortiumId,
    files: [{
      filename: filename1,
      tags: {},
    }, {
      filename: filename2,
      tags: {
        already: 'taggin',
      },
    }, {
      filename: filename3,
      tags: {},
    }],
    metaFile: [
      ['filename', 'Age', 'Diagnosis'],
      ['./controls/M100.txt', '40', 'true'],
      [filename2, '20', 'false'],
      ['./patients/M102.txt', '60', '0'],
    ],
    metaFilePath: path.join(__dirname, 'metadata.csv'),
    metaCovariateMapping: {
      1: 1,
      2: 0,
    },
  };

  const project = {
    dbRegistry: {
      get() {
        return {
          get: dbGetStub,
        };
      },
    },

    // `setMetaContents` mutates the project
    get: sinon.stub().returns(Promise.resolve(cloneDeep(goodProject1))),
    save: sinon.stub().returns(Promise.resolve()),
  };

  const setMetaContents = ProjectService.prototype.setMetaContents.bind(
    project
  );

  t.plan(3);

  setMetaContents(projectId)
    .then(() => {
      t.ok(
        project.get.calledWithExactly(projectId),
        'gets project by ID'
      );
      t.ok(
        dbGetStub.calledWithExactly(consortiumId),
        'gets consortium by ID'
      );

      t.deepEqual(
        project.save.firstCall.args[0].files,
        [{
          filename: filename1,
          tags: {
            age: 40,
            isControl: true,
          },
        }, {
          filename: filename2,
          tags: {
            age: 20,
            already: 'taggin',
            isControl: false,
          },
        }, {
          filename: filename3,
          tags: {
            age: 60,
            isControl: false,
          },
        }],
        'adds tags to project\'s files'
      );
    })
    .catch(t.end);
});

// TODO: This test fails when this file is tested independently. Why?
test('ProjectService - addFiles/removeFiles', (t) => {
  const p1 = projectFactory();
  let c1;

  t.plan(6);

  clientFactory()
  .then(client => {
    c1 = client;
    return c1.projects.save(p1);
  })
  .then((doc) => Object.assign(p1, doc)) // update p1 w/ latest attrs, e.g. _rev
  .then(() => t.equals(p1.files.length, 0, 'files empty on first persist'))
  // pretend to add some files
  .then(() => c1.projects.addFiles(p1, []))
  .then((files) => t.equals(files.length, 0, 'no files added'))
  // add some files
  .then(() => c1.projects.addFiles(p1, __filename))
  .then((files) => {
    t.equals(files.length, 1, 'files added');
    Object.assign(p1.files, files);
  })
  // attempt to add the same file again
  .then(() => c1.projects.addFiles(p1, __filename))
  .then((files) => {
    t.equals(files.length, 1, 'file add request ignored on duplicate filename');
  })
  // remove files
  .then(() => c1.projects.removeFiles(p1, __filename))
  .then((files) => t.equals(files.length, 0, 'file removed'))
  .then(() => c1.teardown())
  .then(() => t.pass('teardown'))
  .then(t.end, t.end);
});

test('ProjectSerice - gets stats', t => {
  const param1 = [0, 1, 2];
  const param2 = 'wat';
  const prepareStub = sinon.stub(fileStats, 'prepare');

  prepareStub.returns(Promise.resolve('bananas'));


  t.plan(3);

  ProjectService.prototype.getFileStats(param1)
    .then(response => {
      t.equal(prepareStub.lastCall.args[0], param1, 'passes array param');
      t.equal(response, 'bananas', 'passes fileStats#prepare response');

      return ProjectService.prototype.getFileStats(param2);
    })
    .then(() => {
      t.deepEqual(
        prepareStub.lastCall.args[0],
        [param2],
        'changes single items to array'
      );
    })
    .catch(t.end)
    .then(prepareStub.restore);
});

test('ProjectService - database listeners', t => {
  const addListenerSpy = sinon.spy();
  const dbAllStub = sinon.stub();
  const dbListenerStub = sinon.stub(
    coinstacCommon.helpers,
    'DBListener'
  );
  const destroyListenerSpy = sinon.spy();
  const projects = [{
    _id: 'wat',
    consortiumId: 'pokeman',
  }, {
    _id: 'doge',
    consortiumId: null,
  }];
  const projectsDb = {
    all: dbAllStub,
    name: 'pikachu',
  };

  function dbRegistryGetStub(dbName) {
    if (dbName === 'projects') {
      return projectsDb;
    }

    return {
      name: dbName,
    };
  }

  dbListenerStub.returns({
    destroy: destroyListenerSpy,
    on: addListenerSpy,
  });
  dbAllStub.returns(Promise.resolve(projects));

  const projectService = new ProjectService({
    client: {},
    dbRegistry: {
      get: dbRegistryGetStub,
    },
  });

  t.plan(7);

  projectService.initializeListeners()
    .then(() => t.fail('Resolves without callback'))
    .catch(() => {
      t.pass('Rejects without callback');

      return projectService.initializeListeners(noop);
    })
    .then(() => {
      t.equal(
        dbListenerStub.firstCall.args[0],
        projectsDb,
        'creates projects db listener'
      );

      t.ok(
        projectService.listeners.has(ProjectService.PROJECTS_LISTENER),
        'adds projects db listener'
      );

      // wires up all current projects with consortium IDs
      t.ok(
        dbListenerStub.calledWith(dbRegistryGetStub(
          `remote-consortium-${projects[0].consortiumId}`
        )),
        'adds listener to projects database'
      );

      // adds referenches to .listeners and .projects
      t.equal(
        projectService.projects.get(projects[0]._id),
        projects[0].consortiumId,
        'adds project with consortium ID'
      );
      t.ok(
        projectService.listeners.has(projects[0].consortiumId),
        'adds consortium ID to listeners'
      );
      t.ok(
        (
          !projectService.projects.has(projects[1]._id) &&
          projectService.listeners.size === 2
        ),
        'Doesn’t add project without consortium ID'
      );
    })
    .catch(t.end)
    .then(() => {
      // teardown
      dbListenerStub.restore();
    });
});

test('ProjectService - database listener events', t => {
  const callbackSpy = sinon.spy();
  const consortium2ChangeDoc = {};
  const consortiumEmitter1 = new EventEmitter();
  const consortiumEmitter2 = new EventEmitter();
  const projectEmitter = new EventEmitter();
  const projects = [{
    _id: 'spongebob',
    consortiumId: 'squarepants',
  }, {
    _id: 'mister',
    consortiumId: 'crabs',
  }];

  const dbListenerStub = sinon.stub(
    coinstacCommon.helpers,
    'DBListener',
    ({ name }) => {
      if (name === 'projects') {
        return projectEmitter;
      } else if (name.indexOf(projects[0].consortiumId) > -1) {
        return consortiumEmitter1;
      } else if (name.indexOf(projects[1].consortiumId) > -1) {
        return consortiumEmitter2;
      }

      throw new Error(`DB name ${name} lacks mock listener`);
    }
  );

  t.plan(6);

  const projectService = new ProjectService({
    client: {},
    dbRegistry: {
      get: dbName => {
        const db = {
          name: dbName,
          get: id => {
            if (dbName === 'projects') {
              return Promise.resolve(projects.find(p => p._id === id));
            }

            return Promise.resolve();
          },
        };

        if (dbName === 'projects') {
          db.all = () => Promise.resolve(projects.slice(0, 1));
        }

        return db;
      },
    },
  });

  projectService.initializeListeners(callbackSpy)
    .then(() => {
      // adds projects db change/delete listeners
      const doc1 = {};
      const doc2 = {};

      t.notOk(callbackSpy.callCount, 'doesn’t call callback initially');

      // Ensure that project changes are reflected in internal stores
      projectEmitter.emit('change', {
        name: 'projects',
        doc: projects[0],
      });
      consortiumEmitter1.emit('change', {
        name: `remote-consortium-${projects[0]._id}`,
        doc: doc1,
      });
      consortiumEmitter1.emit('delete', {
        name: `remote-consortium-${projects[0]._id}`,
        doc: doc2,
      });

      return getNextTick(() => {
        const firstCallArgs = callbackSpy.firstCall.args[1];
        const secondCallArgs = callbackSpy.secondCall.args[1];

        t.ok(
          // Has projects listener and first consortium listnener:
          (
            projectService.listeners.size === 2 &&
            Array.from(projectService.listeners.keys()).indexOf(
              projects[0].consortiumId
            ) > -1 &&
            projectService.projects.size === 1
          ),
          'doesn’t alter internal store'
        );

        t.equal(callbackSpy.callCount, 2, 'only fires callback once per event');

        t.ok(
          firstCallArgs.consortiumId === projects[0].consortiumId &&
          firstCallArgs.doc === doc1 &&
          firstCallArgs.projectId === projects[0]._id,
          'fires callback upon change'
        );

        t.ok(
          secondCallArgs.consortiumId === projects[0].consortiumId &&
          secondCallArgs.doc === doc2 &&
          secondCallArgs.projectId === projects[0]._id,
          'fires callback upon delete'
        );
      });
    })
    .then(() => {
      // Simulate a 'new' project
      projectEmitter.emit('change', {
        doc: projects[1],
        name: 'projects',
      });

      /**
       * Fire on `nextTick` to prevent race conditions with the project's
       * `change` event.
       *
       * @todo Do something about he race conditions
       */
      return getNextTick(() => {
        // Simulate a remote doc change
        consortiumEmitter2.emit('change', {
          doc: consortium2ChangeDoc,
          name: `remote-consortium-${projects[1].consortiumId}`,
        });
      });
    })
    .then(() => {
      t.ok(
        (
          projectService.listeners.size === 3 &&
          Array.from(projectService.listeners.keys()).indexOf(
            projects[1].consortiumId
          ) > -1 &&
          callbackSpy.thirdCall.args[1].doc === consortium2ChangeDoc
        ),
        'adds project’s consortium db listener'
      );
    })
    .catch(t.end)
    .then(() => {
      // teardown
      dbListenerStub.restore();
    });
});
