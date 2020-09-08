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

const METAFILE = [
  ['niftifile', 'site', 'isControl', 'age', 'sex'],
  ['M55406768_swc1t1r1_brain.nii', 'UMN', 'true', '35', 'F'],
  ['M55410676_swc1t1r1_brain.nii', 'UMN', 'true', '27', 'M'],
  ['M55410836_swc1t1r1_brain.nii', 'UMN', 'true', '27', 'M'],
  ['M55411523_swc1t1r1_brain.nii', 'UMN', 'true', '42', 'M'],
  ['M55412141_swc1t1r1_brain.nii', 'UMN', 'true', '24', 'M'],
  ['M55414769_swc1t1r1_brain.nii', 'UMN', 'true', '48', 'F'],
  ['M55415129_swc1t1r1_brain.nii', 'UMN', 'true', '20', 'M'],
  ['M55418630_swc1t1r1_brain.nii', 'UMN', 'true', '34', 'M'],
];

module.exports = {
  CORE_CONFIGURATION,
  METAFILE,
};
