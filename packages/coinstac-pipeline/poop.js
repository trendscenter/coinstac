const docker = require('../coinstac-docker-manager/src/index');

// start(input) {
//   return docker.startService(meta.id, { Image: computation.dockerImage })
//   .then((service) => {
//     console.log(`${mode} RUN`);
//     return service(computation.command.concat([`${JSON.stringify(input)}`]));
//   });
// },
//
const baseDirectory = '/Users/ross/poop';
docker.startService(112332121, {
  Image: 'sum-decent',
  HostConfig: {
    Binds: [
      `${baseDirectory}:/poop:ro`,
      `${baseDirectory}/output:/output:rw`,
      `${baseDirectory}/cache:/cache:rw`,
    ],
  },
})
.then((req) => {
  //   request({
  //     url: `http://127.0.0.1:${port}/run`,
  //     method: 'POST',
  //     json: true,
  //     body: { command: ['ls', '-lah'] },
  //   }, (error, response, body) => {
  //     console.log(error);
  //     console.log(response.statusCode);
  //     console.log(response.body);
  //   });
  // });
  return req(['touch', '/output/t.t']);
}).then(res => console.log(res));
