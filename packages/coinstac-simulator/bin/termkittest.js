const termkit = require('terminal-kit');
const term = require('terminal-kit').terminal;

const myTableContent = {
  computationOutput: '',
  containers: [],
};

function generateComputationOutput() {
  const states = ['running computation', 'stopped', 'waiting'];
  const modes = ['local', 'remote'];

  return {
    currentIteration: Math.floor(Math.random() * 10),
    controllerState: states[Math.floor(Math.random() * states.length)],
    pipelineStep: Math.floor(Math.random() * 5),
    mode: modes[Math.floor(Math.random() * modes.length)],
    totalSteps: Math.floor(Math.random() * 10),
  };
}

function generateContainerStats() {
  const memUsage = Math.floor(Math.random() * 1000);
  const memLimit = Math.floor(Math.random() * 1000);
  const memPercent = memUsage / memLimit;
  const cpuPercent = Math.floor(Math.random() * 1000);

  return {
    containerId: Math.floor(Math.random() * 1000),
    name: Math.floor(Math.random() * 1000),
    memUsage,
    memLimit,
    memPercent,
    cpuPercent,
  };
}

const document = term.createDocument({
  palette: new termkit.Palette(),
});

const containerRowOffset = 5;
const computationRowOffset = 2;

const textTable = new termkit.TextTable({
  parent: document,
  cellContents: [
    ['computation output', '', '', '', '', ''],
    ['currentIteration', 'controllerState', 'pipelineStep', 'mode', 'totalSteps', ''],
    ['', '', '', '', '', ''],
    ['containers', '', '', '', '', ''],
    ['id', 'name', 'memUsage', 'memLimit', 'memPercent', 'cpuPercent'],
    ['', '', '', '', '', ''],
    ['', '', '', '', '', ''],
    ['', '', '', '', '', ''],
    ['', '', '', '', '', ''],
    ['', '', '', '', '', ''],
    ['', '', '', '', '', ''],
    ['', '', '', '', '', ''],
    ['', '', '', '', '', ''],
    ['', '', '', '', '', ''],
    ['', '', '', '', '', ''],
  ],

  contentHasMarkup: true,
  fit: true,
  borderAttr: { color: 'blue' },
  selectable: 'cell',
  autoWidth: 1,
  autoheight: 1,

});


function updateContainerRow(table, rowNumber, containerData) {
  Object.keys(containerData).forEach((key, index) => {
    table.setCellContent(index, rowNumber, containerData[key]);
  });
}

function updateComputationRow(table, computationData) {
  Object.keys(computationData).forEach((key, index) => {
    table.setCellContent(index, computationRowOffset, computationData[key]);
  });
}

const containerStatsInterval = setInterval(async () => {
  const numberOfContainers = Math.floor(Math.random() * 4);
  myTableContent.container = [];
  // clear all container cells
  for (i = 0; i < 10; i++) {
    if (i < numberOfContainers) {
      updateContainerRow(textTable, i + containerRowOffset, generateContainerStats());
    } else {
      updateComputationRow(textTable, i + containerRowOffset, '');
    }
  }
}, 1000);

const computationOutputInterval = setInterval(async () => {
  updateComputationRow(textTable, generateComputationOutput());
}, 1300);
