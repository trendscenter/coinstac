const AWS = require('aws-sdk');
const { isArray } = require('lodash');
const { ObjectID } = require('mongodb');
const helperFunctions = require('../auth-helpers');
const database = require('../database');
const {
  eventEmitter,
  RUN_CHANGED,
} = require('../data/events');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
});

function uploadToS3(fileName, fileStream) {
  const params = {
    Bucket: process.env.AWS_S3_RUN_ASSETS_BUCKET_NAME,
    Key: fileName,
    Body: fileStream,
  };

  return s3.upload(params).promise();
}

function downloadFromS3(fileName) {
  const params = {
    Bucket: process.env.AWS_S3_RUN_ASSETS_BUCKET_NAME,
    Key: fileName,
  };
  const fileStream = s3.getObject(params).createReadStream();
  return fileStream;
}

module.exports = [
  {
    method: 'POST',
    path: '/uploadFiles',
    config: {
      auth: 'coinstac-jwt',
      pre: [
        { method: helperFunctions.canUserUpload, assign: 'runId' },
      ],
      handler: async (req, h) => {
        const { payload } = req;
        const { runId } = req.pre;
        const fileStreams = isArray(payload.file) ? payload.file : [payload.file];

        // update the document to indicate files should be uploaded
        const db = database.getDbInstance();
        await db.collection('runs').updateOne({ _id: ObjectID(runId) }, { $set: { shouldUploadAssets: true, assetsUploaded: false } });
        try {
          await Promise.all(
            fileStreams.map((fileStream) => {
              const fileName = fileStream.hapi.filename;
              return uploadToS3(`${runId}/${fileName}`, fileStream);
            })
          );
        } catch (e) {
          return h.response(e).code(500);
        }
        // update the run document to indicate upload is complete
        const run = await db.collection('runs').findOneAndUpdate(
          { _id: ObjectID(runId) },
          { $set: { assetsUploaded: true } },
          { returnOriginal: false }
        );
        eventEmitter.emit(RUN_CHANGED, run);
        return h.response('file uploaded').code(201);
      },
      payload: {
        output: 'stream',
        parse: true,
        multipart: true,
        allow: ['multipart/form-data', 'application/json'],
        maxBytes: 1000000000000,
      },
    },
  },
  {
    method: 'POST',
    path: '/downloadFiles',
    config: {
      auth: 'coinstac-jwt',
      pre: [
        { method: helperFunctions.canUserDownload, assign: 'runId' },
      ],
      handler: async (req, h) => {
        const { payload } = req;
        const { runId } = req.pre;
        const fileKey = `${runId}/${runId}.tar.gz`;
        try {
          const fileStream = await downloadFromS3(fileKey);
          return h.response(fileStream).code(200);
        } catch (e) {
          console.log(e);
          return h.response(e).code(500);
        }
      },
      payload: {
        output: 'stream',
        parse: true,
        multipart: true,
        allow: ['multipart/form-data', 'application/json'],
        maxBytes: 1000000000000,
      },
    },
  },
];
