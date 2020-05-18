'use strict';

const test = require('ava');
const sinon = require('sinon');
const csvParse = require('csv-parse');
const fsPromise = require('fs').promises;
const fs = require('fs');
const PipelineManager = require('coinstac-pipeline');

const { CORE_CONFIGURATION } = require('./mock');

const CoinstacClient = require('../src');

const managerMock = {
  startPipeline: sinon.stub(),
  stopPipeline: sinon.stub(),
};


test.before(() => {
  sinon.stub(PipelineManager, 'create').resolves(managerMock);
});

test('create client', (t) => {
  // eslint-disable-next-line no-new
  new CoinstacClient(CORE_CONFIGURATION);

  t.pass();

  try {
    // eslint-disable-next-line no-new
    new CoinstacClient();
  } catch (error) {
    t.pass(error.message, 'coinstac-client requires configuration opts');
  }
});

test('client initialize', async (t) => {
  const client = new CoinstacClient(CORE_CONFIGURATION);
  const res = await client.initialize();

  t.deepEqual(managerMock, res);
});

test('getCSV', async (t) => {
  sinon.stub(fsPromise, 'readFile').resolves('file content');

  sinon.stub(csvParse.default).yields(null, 'content');

  await CoinstacClient.getCSV('file1');

  t.pass();

  fsPromise.readFile.restore();
});

test('getFileIndex', (t) => {
  const arr = ['1', ['meta', 'class.csv', 'license', 'test.nii']];
  const res = CoinstacClient.getFileIndex(arr);

  t.is(res, 3);
});

test('parseMetaFile', (t) => {
  const metaFile1 = [['0', '1'], ['meta', 'class.csv', 'license', 'test.nii']];
  const res1 = CoinstacClient.parseMetaFile(metaFile1);
  const expectedRes1 = [[undefined, '0', '1'], ['test.nii', 'meta', 'class.csv', 'license']];

  t.deepEqual(res1, expectedRes1);
});

test('getFilesFromMetadata', (t) => {
  const metaFilePath = '/etc/coinstac/files';
  const metaFile = ['1', ['test.nii', 'license']];

  const res = CoinstacClient.getFilesFromMetadata(metaFilePath, metaFile);

  t.deepEqual(res, ['/etc/coinstac/test.nii']);
});

test.serial('getJSONSchema', async (t) => {
  const schema = { meta: { id: 1 } };
  sinon.stub(fsPromise, 'readFile').resolves(JSON.stringify(schema));
  const res = await CoinstacClient.getJSONSchema('schema');

  t.deepEqual(res, schema);

  fsPromise.readFile.restore();
});

test.serial('getSubPathAndGroupExtension', async (t) => {
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

  const group3 = { paths: ['test', 'class'], parentDir: '/etc/coinstac', extension: 'csv' };
  const res3 = await CoinstacClient.getSubPathsAndGroupExtension(group3);

  t.pass(res3, { paths: [], extension: null });

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

  const group4 = { paths: ['test', 'class'], parentDir: '/etc/coinstac', extension: 'nii' };
  const res4 = await CoinstacClient.getSubPathsAndGroupExtension(group4, true);

  t.pass(res4, { paths: ['/etc/coinstac/class'], extension: null });

  fsPromise.stat.restore();
  fsPromise.readdir.restore();
});

test.serial('startPipeline', async (t) => {
  const client = new CoinstacClient(CORE_CONFIGURATION);
  await client.initialize();

  sinon.stub(fs, 'mkdir').yields(null);
  sinon.stub(fsPromise, 'link').resolves();

  await client.startPipeline(
    [],
    'consortium-1',
    { name: 'pipeline', timeout: 10 },
    ['test.nii', 'test.csv'],
    'run-1'
  );

  t.pass();

  fsPromise.link.restore();

  sinon.stub(fsPromise, 'link').rejects({ code: 'EACCESS' });

  try {
    await client.startPipeline(
      [],
      'consortium-1',
      { name: 'pipeline', timeout: 10 },
      ['test.nii', 'test.csv'],
      'run-1'
    );
  } catch {
    t.pass();
  }

  fsPromise.link.restore();
});

test.serial('requestPipelineStop', async (t) => {
  const client = new CoinstacClient(CORE_CONFIGURATION);
  await client.initialize();

  client.requestPipelineStop();

  t.pass();
});

test.serial('unlinkFiles', async (t) => {
  const client = new CoinstacClient(CORE_CONFIGURATION);

  sinon.stub(fsPromise, 'stat').rejects({ code: 'ENOENT' });

  const files1 = await client.unlinkFiles('run-1');
  t.deepEqual(files1, []);

  fsPromise.stat.restore();

  /* new case */
  sinon.stub(fsPromise, 'stat').rejects('error');

  try {
    await client.unlinkFiles('run-1');
  } catch {
    t.pass();
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

test.after.always('cleanup', () => {
  PipelineManager.create.restore();
});
