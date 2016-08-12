'use strict';

const { get, noop, set } = require('lodash');

module.exports = {
  preRun: {
    local: noop,

    /**
     * @param {Object} runInputs
     * @param {ComputationResult} compResult
     * @param {Object} hooks
     * @param {Function} hooks.cancelRun
     * @param {Function} hooks.forceSave
     * @param {Function} hooks.isRunCancelled
     * @returns {(ComputationResult|undefined)} Transformed compResult if a doc
     * update is required, otherwise `undefined`.
     */
    remote(runInputs, compResult, hooks) {
      const SELECTOR = 'pluginState[\'inputs\']';
      const remoteInputs = get(compResult, SELECTOR);

      if (remoteInputs && Array.isArray(remoteInputs)) {
        return;
      }

      let localInputs;

      for (const runInput of runInputs) {
        const inputs = get(runInput, SELECTOR);

        if (inputs && Array.isArray(inputs)) {
          localInputs = inputs;
          break;
        }
      }

      if (!localInputs) {
        return;
      }

      set(compResult, SELECTOR, localInputs);
      hooks.forceSave();

      return compResult;
    },
  },
  postRun: {
    local: noop,
    remote: noop,
  },
};
