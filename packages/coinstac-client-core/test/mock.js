const CORE_CONFIGURATION = {
  logger: {
    silly: () => {},
  },
  userId: 'test-1',
  logLevel: 'info',
  appDirectory: '/etc/coinstac',
  fileServer: {
    hostname: 'localhost',
    pathname: '/transfer',
    port: '3300',
    protocol: 'http:',
  },
  mqttServer: {
    hostname: 'localhost',
    pathname: '',
    port: '1883',
    protocol: 'mqtt:',
  },
};

module.exports = {
  CORE_CONFIGURATION,
};
