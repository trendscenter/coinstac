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
      auth: false,
      pre: [
        // validate the API token
        // deterimine if the user is a part of the run
        // { method: helperFunctions.validateUser, assign: 'user' },
      ],
      handler: async (req, h) => {
        const { payload } = req;
        await Promise.all(
          payload.file.map((fileStream) => {
            const fileName = fileStream.hapi.filename;
            fileStream.on('data', (d) => {
              console.log(d);
            });
            return uploadToS3(fileName, fileStream);
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
      ],
      handler: (req, h) => {

        return h.response().code(201);
      },
    },
  },
];
