'use strict';

module.exports = {
  local: {
    args: ['./exec-script.js', '--local'],
    cmd: 'node',
    /**
     * @todo Remove once covariate inputs aren't required.
     *
     * {@link https://github.com/MRN-Code/coinstac/issues/161}
     */
    inputs: [{
      type: 'covariates',
    }],
    type: 'cmd',
    verbose: true,
  },
  name: 'test',
  remote: {
    args: ['./exec-script.js', '--remote'],
    cmd: 'node',
    type: 'cmd',
    verbose: true,
  },
  version: '1.0.0',
};
