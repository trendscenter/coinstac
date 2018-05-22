module.exports = {
  local: {
    meta: {
      name: 'local test',
      id: 'coinstac-local-test',
      version: 'v1.0.0',
      repository: 'github.com/user/computation.git',
      description: 'a test that sums the last two numbers together for the next',
    },
    computation: {
      type: 'docker',
      dockerImage: 'coinstac/coinstac-local-test',
      command: ['python', '/computation/local.py'],
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
      display: {
        type: 'table',
      },
    },
  },
  localError: {
    meta: {
      name: 'local test',
      id: 'coinstac-local-error',
      version: 'v1.0.0',
      repository: 'github.com/user/computation.git',
      description: 'a test that sums the last two numbers together for the next',
    },
    computation: {
      type: 'docker',
      dockerImage: 'coinstac/coinstac-local-error',
      command: ['python', '/computation/local.py'],
      input: {
      },
      output: {
      },
      display: {
        type: 'table',
      },
    },
  },
  decentralized: {
    meta: {
      name: 'decentralized test',
      id: 'coinstac-decentralized-test',
      version: 'v1.0.0',
      repository: 'github.com/user/computation.git',
      description: 'a test that sums the last two numbers together for the next',
    },
    computation: {
      type: 'docker',
      dockerImage: 'coinstac/coinstac-decentralized-test',
      command: ['python', '/computation/local.py'],
      remote: {
        type: 'docker',
        dockerImage: 'coinstac/coinstac-decentralized-test',
        command: ['python', '/computation/remote.py'],
      },
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
      display: {
        type: 'table',
      },
    },
  },
  decentralizedError: {
    meta: {
      name: 'decentralized test',
      id: 'coinstac-decentralized-error',
      version: 'v1.0.0',
      repository: 'github.com/user/computation.git',
      description: 'a test that sums the last two numbers together for the next',
    },
    computation: {
      type: 'docker',
      dockerImage: 'coinstac/coinstac-decentralized-error',
      command: ['python', '/computation/local.py'],
      remote: {
        type: 'docker',
        dockerImage: 'coinstac/coinstac-decentralized-error',
        command: ['python', '/computation/remote.py'],
      },
      input: {
        mode: {
          type: 'string',
        },
        user: {
          type: 'string',
        },
      },
      output: {
      },
      display: {
        type: 'table',
      },
    },
  },
};
