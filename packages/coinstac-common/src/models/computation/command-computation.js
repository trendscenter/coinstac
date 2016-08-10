'use strict';

const Computation = require('./computation.js');
const spawn = require('child_process').spawn;
const joi = require('joi');

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
    let cmd;
    let jsonStr = '';
    let errMsg = '';
    return new Promise((res, rej) => {
      const stringifiedRunputs = JSON.stringify(opts);
      const args = (this.args || []).concat(['--run', stringifiedRunputs]);
      try {
        cmd = spawn(this.cmd, args, { cwd: this.cwd });
      } catch (err) {
        /* istanbul ignore if */
        if (this.verbose) { console.error(err && err.message); } // eslint-disable-line
        return rej(err);
      }
      /* istanbul ignore next */
      cmd.on('error', (err) => {
        const coreArgs = this.args.join(' ');
        console.error([ // eslint-disable-line
          `command failed to run: ${err.message}\n`,
          'this most often indicates that there is an error in the command\n',
          `\tcmd: ${this.cmd} ${coreArgs} --run '{ ...coinstac-inputs }\n`,
          `\tcwd: ${this.cwd}`,
        ].join(''));
        return rej(err);
      });
      cmd.stderr.on('data', (data) => { errMsg += data; });
      cmd.stdout.on('data', (data) => { jsonStr += data; });
      cmd.on('exit', (code) => {
        let rslt;
        if (code) {
          console.error(`process exited with code ${code}`); // eslint-disable-line
          return rej(new Error(`CommandComputation: ${errMsg}`));
        }
        try {
          if (jsonStr === '') { return res(); } // permit ''
          rslt = JSON.parse(jsonStr);
          /* istanbul ignore if */
          if (this.verbose) {
            console.error(errMsg); // eslint-disable-line
          }
        } catch (err) {
          // TODO: Figure out what this error logging does
          /* eslint-disable */
          console.error([
            'failed to parse computation results. invalid JSON:',
            (err && err.message || '').substr(0, 50) + '...',
          ].join(' '));
          /* eslint-enable */

          /* istanbul ignore if */
          if (this.verbose) { console.error(errMsg); } // eslint-disable-line
          return rej(err);
        }
        return res(rslt);
      });
      return null;
    });
  }
}

CommandComputation.schema = Object.assign({
  type: joi.string().regex(/cmd/).required(),
  cmd: joi.string().min(1).required(),
  args: joi.array(),
}, Computation.schema);

module.exports = CommandComputation;
