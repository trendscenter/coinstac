'use strict';

const common = require('../../../');
const computations = common.models.computation;
const Pipeline = require('../../../').models.pipeline.Pipeline;
const JavascriptComputation = computations.JavascriptComputation;
const bluebird = require('bluebird');

module.exports = {
  /**
   * @function basic
   * gets Pipeline constructor options where the pipeline consists of
   * a single, basic computation
   * @returns {object} Pipeline input
   */
  basic: function() {
    let comps = [
      new JavascriptComputation({
        type: 'function',
        fn: (opts) => Promise.resolve(0),
        cwd: __dirname
      })
    ];
    return new Pipeline({ computations: comps });
  },

  /**
   * @function basicAsync
   * gets Pipeline constructor options where the pipeline consists of
   * a single, basic computation
   * @returns {object} Pipeline input
   */
  basicAsync: function() {
    let comps = [
      new JavascriptComputation({
        type: 'function',
        fn: (opts) => bluebird.delay(1).then(() => 1),
        cwd: __dirname
      })
    ];
    return new Pipeline({ computations: comps });
  },

  /**
   * @function basicMultiAsyncStep
   * @returns {object} Pipeline input
   */
  basicMultiAsyncStep: function() {
    let comps = [
      new JavascriptComputation({
        type: 'function',
        fn: (opts) => bluebird.delay(1).then(() => 'computation-1'),
        cwd: __dirname
      }),
      new JavascriptComputation({
        type: 'function',
        fn: (opts) => bluebird.delay(1).then(() => 'computation-2'),
        cwd: __dirname
      }),
      new JavascriptComputation({
          type: 'function',
          fn: (opts) => bluebird.delay(1).then(() => 'computation-3'),
          cwd: __dirname
      })
    ];
    return new Pipeline({ computations: comps });
  },

  /**
   * @function basicError
   * gets Pipeline constructor options where the pipeline consists of
   * a single, basic computation
   * @returns {object} Pipeline input
   */
  basicError: function() {
    let computations = [
      new JavascriptComputation({
        type: 'function',
        fn: (opts) => Promise.reject(new Error('test-run-error')),
        cwd: __dirname
      })
    ];
    return new Pipeline({ computations });
  },

  /**
   * @function basicDouble
   * gets Pipeline constructor options where the pipeline consists of two
   * computations.
   * @returns {object} Pipeline input
   */
  basicDouble: function() {
    let comps = [
      new JavascriptComputation({
        type: 'function',
        fn: (opts) => Promise.resolve(1),
        cwd: __dirname
      }),
      new JavascriptComputation({
        type: 'function',
        fn: (opts) => Promise.resolve(opts.previousData + 1),
        cwd: __dirname
      })
    ];
    return new Pipeline({ computations: comps });
  },

  /**
   * @function basicDoubleNext
   * gets Pipeline constructor options where the pipeline consists of two
   * computations.  The first computation has an async `next` member which
   * signals to progress the pipeline automatically
   * @returns {object} Pipeline input
   */
  basicDoubleNext: function() {
    let comps = [
      new JavascriptComputation({
        type: 'function',
        fn: (opts) => Promise.resolve(1),
        cwd: __dirname,
        next: new JavascriptComputation({
          type: 'function',
          fn: function(opts) {
            if (!this.skippedOnFirstCall) {
              // don't progress on pre-run next
              this.skippedOnFirstCall = true;
              return bluebird.delay(1).then(() => false);
            }
            // but do progress on post-run next
            return bluebird.delay(1).then(() => true);
          },
          cwd: __dirname
        })
      }),
      new JavascriptComputation({
          type: 'function',
          fn: (opts) => Promise.resolve(2),
          cwd: __dirname
      })
    ];
    return new Pipeline({ computations: comps });
  },

  /**
   * @function invalidOptsNextPreRunError
   * gets Pipeline constructor options where the pipeline consists of two
   * computations.  The first computation will error out on next, during the
   * `pre-run` next call
   * @returns {object} Pipeline input
   */
  invalidOptsNextPreRunError: function() {
    let computations = [
      new JavascriptComputation({
        type: 'function',
        fn: (opts) => Promise.resolve(1),
        cwd: __dirname,
        next: new JavascriptComputation({
          type: 'function',
          fn: (opts) => Promise.reject(new Error('test-next-error-pre-run')),
          cwd: __dirname
        })
      }),
      new JavascriptComputation({
        type: 'function',
        fn: (opts) => Promise.resolve(2),
        cwd: __dirname
      })
    ];
    return new Pipeline({ computations });
  },

  /**
   * @function invalidOptsNextPostRunError
   * gets Pipeline constructor options where the pipeline consists of two
   * computations.  The first computation will error out on next, during the
   * `post-run` next call
   * @returns {object} Pipeline input
   */
  invalidOptsNextPostRunError: function() {
    let computations = [
      new JavascriptComputation({
        type: 'function',
        fn: (opts) => Promise.resolve(1),
        cwd: __dirname,
        next: new JavascriptComputation({
            type: 'function',
            fn: (opts) => {
              if (!this.firstCalled) {
                this.firstCalled = true;
                return Promise.resolve(false);
              }
              return Promise.reject(new Error('test-next-post-run-error'));
            },
            cwd: __dirname
        })
      }),
      new JavascriptComputation({
        type: 'function',
        fn: (opts) => Promise.resolve(2),
        cwd: __dirname
      })
    ];
    return new Pipeline({ computations });
  },

  /**
   * @returns {object} Pipeline input
   */
  userTriggeredStepping: function() {
    let comps = [
      new JavascriptComputation({
        type: 'function',
        fn: (opts) => Promise.resolve(1),
        cwd: __dirname,
        next: new JavascriptComputation({
          type: 'function',
          fn: (opts) => Promise.resolve(opts.proceed),
          cwd: __dirname
        })
      }),
      new JavascriptComputation({
        type: 'function',
        fn: (opts) => Promise.resolve(2),
        cwd: __dirname
      })
    ];
    return new Pipeline({ computations: comps });
  }
};
