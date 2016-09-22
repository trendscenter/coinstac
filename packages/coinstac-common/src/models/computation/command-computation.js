'use strict';

const Computation = require('./computation.js');
const cp = require('child_process');
const indentString = require('indent-string');
const joi = require('joi');
const jph = require('json-parse-helpfulerror');

/**
 * @class CommandComputation
 * @extends Computation
 * @constructor
 * @property {string} cmd command to be called.  must be on user's $PATH
 * @property {string[]} args arguments passed to `cmd`
 * @property {boolean} verbose permit logging of stderr from computations into
 *                             parent process
 * @example <caption>Construct a new CommandComputation</caption>
 * new CommandComputation({
 *     cwd: '/tmp',
 *     type: 'cmd',
 *     cmd: 'python',
 *     args: ['-c', 'import json; print json.dumps({ "foo": "bar" });']
 * })
 */
class CommandComputation extends Computation {

  /**
   * @description run a computation via making a shell call
   * @param {object} opts (no current opts supported)
   * @returns {Promise}
   */
  run(opts) {
    return new Promise((res, rej) => {
      const args = (this.args || []).concat(['--run', JSON.stringify(opts)]);
      let jsonStr = '';
      let errMsg = '';
      const handleError = error => {
        if (this.verbose) {
          /* eslint-disable no-console */
          console.error(`Command failed to run:

${indentString(`${this.cmd} ${args.join(' ')}`, 2)}

stdout:

${indentString(jsonStr, 2)}

stderr:

${indentString(errMsg, 2)}
`);
          console.error(error);
          /* eslint-enable no-console */
        }
        rej(error);
      };
      const maybeLogStderr = () => {
        if (this.verbose && errMsg) {
          console.error(errMsg); // eslint-disable-line no-console
        }
      };

      try {
        const cmd = cp.spawn(this.cmd, args, { cwd: this.cwd });

        cmd.on('error', handleError);
        cmd.stderr.on('data', data => {
          errMsg += data;
        });
        cmd.stdout.on('data', data => {
          jsonStr += data;
        });
        cmd.on('exit', code => {
          if (code) {
            handleError(new Error(`Process exited with code ${code}:

${errMsg}`));
          } else if (jsonStr === '') {
            // permit ''
            res();
            maybeLogStderr();
          } else {
            try {
              res(jph.parse(jsonStr));
              maybeLogStderr();
            } catch (error) {
              handleError(error);
            }
          }

          /**
           * Reset output so it's not persisted to the next call.
           *
           * @todo Determine why this is necessary.
           */
          errMsg = '';
          jsonStr = '';
        });
      } catch (error) {
        handleError(error);
      }
    });
  }
}

CommandComputation.schema = Object.assign({
  type: joi.string().regex(/cmd/).required(),
  cmd: joi.string().min(1).required(),
  args: joi.array(),
}, Computation.schema);

module.exports = CommandComputation;
