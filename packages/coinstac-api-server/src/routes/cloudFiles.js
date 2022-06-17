const AWS = require('aws-sdk');
const { isArray } = require('lodash');
const helperFunctions = require('../auth-helpers');


function uploadToS3(fileName, fileStream) {
  const params = { Bucket: process.env.AWS_S3_RUN_ASSETS_BUCKET_NAME, Key: fileName, Body: fileStream };
  const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
  });
  return s3.upload(params).promise();
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
        try {


          await Promise.all(
            fileStreams.map((fileStream) => {
              const fileName = fileStream.hapi.filename;
              console.log(`${runId}-${fileName}`);
              fileStream.on('data', (d) => {
                console.log('data');
              });
              return uploadToS3(`${runId}/${fileName}`, fileStream);
            })
          );
        } catch (e) {
          console.log(e)
        }
        return h.response().code(201);
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
      auth: false,
      pre: [
        // { method: helperFunctions.validateUser, assign: 'user' },
        // determine if this user has permission to download this file
        // was this user a part of the consortia that owned this run?
      ],
      handler: (req, h) => {
        return h.response().code(201);
      },
    },
  },
]
