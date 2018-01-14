const blessed = require('blessed');
const contrib = require('blessed-contrib');
const PipelineManager = require('./pipeline-manager');
const path = require('path');

const args = process.argv.slice(2);
// const screen = blessed.screen();
// const table = contrib.table(
//   { keys: true,
//     fg: 'white',
//     selectedFg: 'white',
//     selectedBg: 'blue',
//     interactive: true,
//     label: 'Active Pipelines',
//     width: '100%',
//     height: '100%',
//     border: { type: 'line', fg: 'cyan' },
//     columnSpacing: 10, // in chars
//     columnWidth: [5, 5, 10, 100], /*in chars*/
//   }
// );
//
// // allow control the table with the keyboard
// table.focus();
// screen.append(table);
// table.setData(
//   {
//     headers: ['pipeline', 'iteration', 'value'],
//     data: [],
//   }
// );
//
// screen.key(['escape', 'q', 'C-c'], () => {
//   return process.exit(0);
// });
// screen.render();
//
// const update = (display) => {
//   table.setData(
//     {
//       headers: ['pipeline', 'iteration', 'cache', 'output'],
//       data: display,
//     }
//   );
//   screen.render();
// };

const compSpec = {
  meta: {
    name: 'sum demo',
    id: 'sum-demo',
    version: 'v1.0.0',
    repository: 'github.com/user/computation.git',
    description: 'a demo that sums the last two numbers together for the next',
  },
  computation: {
    type: 'docker',
    dockerImage: 'sum',
    command: ['python', '/computation/local.py'],
    // remote: {
    //   type: 'docker',
    //   dockerImage: 'sum',
    //   command: ['python', '/computation/remote.py'],
    // },
    input: {
      start: {
        type: 'number',
      },
    },
    output: {
      sum: {
        type: 'number',
      },
    },
  },
};
const pipelineSpec = {
  steps: [
    {
      controller: 'local',
      computations: [compSpec],
      inputMap: {
        start: { value: 1 },
      },
    },
    {
      controller: 'local',
      computations: [compSpec],
      inputMap: {
        start: { fromCache: { step: 0, variable: 'sum' } },
      },
    },
  ],
};

// const remote = PipelineManager.create({
//   mode: 'remote',
//   clientId: 'remote',
//   operatingDirectory: './remote',
// });

const local = PipelineManager.create({
  mode: 'local',
  clientId: 'one',
  operatingDirectory: path.resolve(__dirname, 'local'),
});
const pipeline = local.startPipeline({
  spec: pipelineSpec,
  runId: 'poop22',
});

pipeline.result.then((out) => {
  debugger;
  console.log(out);
});

// remote.startPipeline({
//   spec: pipelineSpec,
//   clients: ['one'],
//   runId: 'poop22',
// })
// .then(out => {
//   debugger;
//   console.log(out);
// });


// const pipelines = [];
// const display = [];
// for (let i = 0; i < args[0]; i += 1) {
//   pipelines.push(Pipeline.create(pipelineSpec, i));
//   display[i] = [];
// }
//
// pipelines.forEach((pipeline, index) => {
//   pipeline.steps[0].iterationEmitter.on('update', (iteration, cache, output) => {
//     display[index] =
//       [index, iteration || 0, JSON.stringify(cache || {}), JSON.stringify(output || {})];
//     update(display);
//   });
//   pipeline.run()
//   // .then(res => console.log(res));
// });
