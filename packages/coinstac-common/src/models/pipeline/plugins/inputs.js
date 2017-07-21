'use strict';

const { get, set } = require('lodash');

/**
 * Plugin's state location in a `ComputationResult` document.
 *
 * @const {string}
 */
const SELECTOR = 'pluginState.inputs';

/**
 * Is a inputs item valid?
 *
 * @todo Use a joi schema?
 *
 * @param {*} inputs
 * @returns {boolean} Whether the `inputs` looks as expected.
 */
function isValidInputs(inputs) {
  return !!inputs && Array.isArray(inputs) && !!inputs.length;
}

module.exports = {
  preRun: {
    /**
     * @param {Object} runInput
     * @param {RemoteComputationResult} runInput.remoteResult
     * @param {LocalComputationResult} compResult
     * @param {Object} hooks
     * @param {Function} hooks.cancelRun
     * @param {Function} hooks.forceSave
     * @param {Function} hooks.isRunCancelled
     * @returns {(LocalComputationResult|undefined)}
     */
    local(runInput, compResult, hooks) {
      /**
       * @todo: Determine why are a client's local info is stored on a
       * `RemoteComputationResult`.
       */
      const remoteInputs = get(runInput.remoteResult, SELECTOR);
      const localInputs = get(compResult, SELECTOR);

      // Save inputs to `compResult` if it doesn't yet contain them:
      if (!isValidInputs(localInputs) && isValidInputs(remoteInputs)) {
        set(compResult, SELECTOR, remoteInputs);
        hooks.forceSave();

        return compResult;
      }
    },

    /**
     * @param {Object} runInput
     * @param {Object[]} runInput.userResults Collection of user result docs
     * @param {ComputationResult} compResult
     * @param {Object} hooks
     * @param {Function} hooks.cancelRun
     * @param {Function} hooks.forceSave
     * @param {Function} hooks.isRunCancelled
     * @returns {(ComputationResult|undefined)} Transformed compResult if a doc
     * update is required, otherwise `undefined`.
     */
    remote(runInput, compResult, hooks) {
      const remoteInputs = get(compResult, SELECTOR);

      if (isValidInputs(remoteInputs)) {
        return;
      }

      let localInputs;

      for (let i = 0; i < runInput.userResults.length; i += 1) {
        const result = runInput.userResults[i];
        const inputs = get(result, SELECTOR);

        if (isValidInputs(inputs)) {
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
};

