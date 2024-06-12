'use strict';

/* eslint-disable-next-line import/no-unresolved */
const test = require('ava');
const sinon = require('sinon');
const csvParse = require('csv-parse');
const fsPromise = require('fs').promises;
const fs = require('fs');
const PipelineManager = require('coinstac-pipeline');

const { CORE_CONFIGURATION, METAFILE } = require('./mock');

const CoinstacClient = require('../src');

const managerMock = {
  startPipeline: sinon.spy(),
  stopPipeline: sinon.spy(),
};

let client;

test.before(async () => {
  sinon.stub(PipelineManager, 'create').resolves(managerMock);

  client = new CoinstacClient(CORE_CONFIGURATION);
  await client.initialize();
});

test('create client', (t) => {
  try {
    // eslint-disable-next-line no-new
    new CoinstacClient();
  } catch (error) {
    t.is(error.message, 'coinstac-client requires configuration opts');
  }
});

test('getCSV and getJSONSchema', async (t) => {
  /**
   * getCSV
   */
  sinon.stub(fsPromise, 'readFile').resolves('file content');
  sinon.stub(csvParse.default).yields(null, 'content');

  const res1 = await CoinstacClient.getCSV('file1');
  t.is(res1, JSON.stringify([['file content']]));

  fsPromise.readFile.restore();

  const fileError = new Error('Cannot find');
  sinon.stub(fsPromise, 'readFile').rejects(fileError);

  try {
    await CoinstacClient.getCSV('file1');
  } catch (error) {
    t.is(error, fileError);
  }

  fsPromise.readFile.restore();

  /**
   * getJSONSchema
   */
  const schema = { meta: { id: 1 } };
  sinon.stub(fsPromise, 'readFile').resolves(JSON.stringify(schema));
  const res2 = await CoinstacClient.getJSONSchema('schema');

  t.deepEqual(res2, schema);

  fsPromise.readFile.restore();
});

test('getFileIndex', (t) => {
  const res = CoinstacClient.getFileIndex(METAFILE);

  t.is(res, 0);
});

test('parseMetaFile', (t) => {
  const res = CoinstacClient.parseMetaFile(METAFILE);

  t.deepEqual(res, METAFILE);
});

test('getFilesFromMetadata', (t) => {
  const metaFilePath = '/etc/coinstac/files';

  const res = CoinstacClient.getFilesFromMetadata(metaFilePath, METAFILE);

  t.deepEqual(res.length, METAFILE.length - 1);
});

test('getSubPathsAndGroupExtension and unlinkFiles', async (t) => {
  /**
   * getSubPathsAndGroupExtension
   */
  const group1 = { paths: [] };
  const res1 = await CoinstacClient.getSubPathsAndGroupExtension(group1);
  t.is(res1, null);

  const group2 = { paths: ['/etc/coinstac/test.nii'], error: 'TypeError' };
  const res2 = await CoinstacClient.getSubPathsAndGroupExtension(group2);
  t.deepEqual(res2, group2);

  let isDirectory = sinon.stub()
    .onFirstCall()
    .returns(true)
    .returns(false);
  sinon.stub(fsPromise, 'stat').resolves({ isDirectory });

  sinon.stub(fsPromise, 'readdir')
    .onFirstCall()
    .resolves(['test.nii', 'test.gz'])
    .resolves([]);

  const group3 = { paths: ['dev/test.nii', 'dev/class.csv'], parentDir: '/etc/coinstac', extension: 'csv' };
  const res3 = await CoinstacClient.getSubPathsAndGroupExtension(group3);

  t.deepEqual(res3, { paths: [], extension: null });

  fsPromise.stat.restore();
  fsPromise.readdir.restore();

  /* new case */
  isDirectory = sinon.stub()
    .onFirstCall()
    .returns(true)
    .returns(false);
  sinon.stub(fsPromise, 'stat').resolves({ isDirectory });

  sinon.stub(fsPromise, 'readdir')
    .onFirstCall()
    .resolves(['test.nii', 'dir'])
    .resolves([]);

  const group4 = { paths: ['home/test.nii', 'home/class.csv'], parentDir: '/etc/coinstac', extension: 'nii' };
  const res4 = await CoinstacClient.getSubPathsAndGroupExtension(group4, true);

  t.deepEqual(res4, { paths: ['/etc/coinstac/home/class.csv'], extension: null });

  fsPromise.stat.restore();
  fsPromise.readdir.restore();

  /**
   * unlinkFiles
   */
  sinon.stub(fsPromise, 'stat').rejects({ code: 'ENOENT' });

  const files1 = await client.unlinkFiles('run-1');
  t.deepEqual(files1, []);

  fsPromise.stat.restore();

  /* new case */
  const statError = new Error('error');
  sinon.stub(fsPromise, 'stat').rejects(statError);

  try {
    await client.unlinkFiles('run-1');
  } catch (error) {
    t.is(error, statError);
  }

  fsPromise.stat.restore();

  /* new case */
  const inputFiles = ['file-1', 'file-2'];
  sinon.stub(fsPromise, 'stat').resolves({ isDirectory: sinon.stub().returns(true) });
  sinon.stub(fsPromise, 'readdir').resolves(inputFiles);
  sinon.stub(fsPromise, 'unlink').resolves();

  const files2 = await client.unlinkFiles('run-1');

  t.is(files2.length, inputFiles.length);

  fsPromise.stat.restore();
  fsPromise.readdir.restore();
});

test('startPipeline', async (t) => {
  await client.initialize();

  sinon.stub(fs, 'mkdir').yields(null);
  sinon.stub(fsPromise, 'link').resolves();

  const clients = {};
  const consortiumId = 'consortium-1';
  const clientPipeline = { name: 'pipeline', timeout: 10 };
  const filesArray = ['test.nii', 'test.csv'];
  const runId = 'run-1';

  await client.startPipeline(clients, consortiumId, clientPipeline, filesArray, runId);

  t.pass();

  fsPromise.link.restore();

  const errorCode = 'EACCESS';

  sinon.stub(fsPromise, 'link').rejects({ code: errorCode });

  try {
    await client.startPipeline(
      {},
      'consortium-1',
      { name: 'pipeline', timeout: 10 },
      ['test.nii', 'test.csv'],
      'run-1'
    );
  } catch (error) {
    t.is(error.code, errorCode);
  }

  fsPromise.link.restore();
});

test('requestPipelineStop', async (t) => {
  const pipelineId = 'pineline-1';
  const runId = 'run-1';
  client.requestPipelineStop(pipelineId, runId);

  t.true(managerMock.stopPipeline.calledWith(runId));
});

test.after.always('cleanup', () => {
  PipelineManager.create.restore();
});
