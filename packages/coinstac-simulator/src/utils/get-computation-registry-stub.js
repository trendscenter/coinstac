'use strict';

const DecentralizedComputation =
  require('coinstac-common').models.DecentralizedComputation;
const path = require('path');

/**
 * Get computation registry stub.
 * @module
 *
 * Get an object that behaves like `ComputationRegistry` but contains a stubbed
 * computation via the `computationPath` paramter.
 *
 * @param {string} computationPath
 * @returns {Object}
 */
module.exports = function getComputationRegistryStub(computationPath) {
  const definition = require(computationPath); // eslint-disable-line global-require

  const computation = new DecentralizedComputation(Object.assign({
    cwd: path.dirname(computationPath),
    meta: {
      description: definition.name,
      name: definition.name,
    },
    repository: {
      url: `http://github.com/${definition.name}`,
    },
  }, definition));

  return {
    add() {
      return computation;
    },
    all() {
      return [computation];
    },
  };
};
