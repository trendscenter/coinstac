const AWS = require('aws-sdk');
const helperFunctions = require('../auth-helpers');


function uploadToS3(fileName, fileStream) {
  // const params = { Bucket: 'bucket', Key: fileName, Body: fileStream };
  // const s3 = new AWS.S3();
  // return s3.upload(params).promise();
  return Promise.resolve('resolved');
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
        await Promise.all(
          payload.file.map((fileStream) => {
            const fileName = fileStream.hapi.filename;
            fileStream.on('data', (d) => {
              console.log(d);
            });
            console.log(`${runId}-${fileName}`);
            return uploadToS3(`${runId}-${fileName}`, fileStream);
          })
        );
        return h.response().code(201);
      },
      payload: {
        output: 'stream',
        parse: true,
        multipart: true,
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
];
