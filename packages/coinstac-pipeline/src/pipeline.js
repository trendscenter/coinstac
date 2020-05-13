'use strict';

const fs = require('fs');
const pify = require('util').promisify;
const Emitter = require('events');
const {
  join,
  dirname,
  relative,
  sep,
} = require('path');
const mkdirp = pify(require('mkdirp'));
const rimraf = pify(require('rimraf'));
const Controller = require('./controller');

const hardLink = pify(fs.link);

module.exports = {
  create(
    { steps },
    runId,
    {
      mode,
      operatingDirectory,
      clientId,
      userDirectories,
      owner,
      logger,
      dockerManager,
    }
  ) {
    const cache = {};
    let currentStep;
    let currentState;

    const stateEmitter = new Emitter();


    const pipelineSteps = steps.map(
      step => Controller.create(step, runId, {
        mode,
        operatingDirectory,
        clientId,
        owner,
        logger,
        dockerManager,
      })
    );

    const prepCache = (pipelineSpec) => {
      pipelineSpec.forEach((step) => {
        for (let [key, val] of Object.entries(step.inputMap)) { // eslint-disable-line no-restricted-syntax, no-unused-vars, max-len, prefer-const
          if (val.fromCache) {
            // the currentComputation index may be dynamic if
            // mult comps per step is added as a feature
            const { meta, computation } = pipelineSteps[val.fromCache.step]
              .controllerState.currentComputations[0];
            cache[val.fromCache.step] = Object.assign(
              {
                preprocess: !!meta.preprocess,
                variables: Object.assign(
                  {},
                  cache[val.fromCache.step] ? cache[val.fromCache.step].variables : {},
                  {
                    [val.fromCache.variable]:
                     Object.assign({}, computation.output[val.fromCache.variable]),
                  }
                ),
              }
            );
          }
        }
      });
    };


    // remote doesn't get any step input, happens all client side
    if (mode !== 'remote') {
      prepCache(steps);
    }
    return {
      cache,
      currentState,
      currentStep,
      id: runId,
      mode,
      stateEmitter,
      pipelineSteps,
      run(remoteHandler) {
        const packageState = () => {
          const { controllerState } = this.pipelineSteps[this.currentStep];

          this.currentState = {
            currentIteration: controllerState.iteration,
            controllerState: controllerState.state,
            pipelineStep: this.currentStep,
            mode: this.mode,
            totalSteps: this.pipelineSteps.length,
            owner,
          };

          return this.currentState;
        };
        const fpCleanup = [];
        const setStateProp = (prop, val) => {
          this[prop] = val;
          stateEmitter.emit('update', packageState());
        };
        pipelineSteps.forEach(
          (step) => {
            step.stateEmitter.on('update', () => stateEmitter.emit('update', packageState()));
          }
        );
        // TODO: simlink here
        const loadCache = (output, step) => {
          const proms = [];
          if (cache[step]) {
            for (let [key] of Object.entries(cache[step].variables)) { // eslint-disable-line no-restricted-syntax, max-len, prefer-const
              if (cache[step].variables[key].type === 'array' && key === 'covariates' && cache[step].preprocess) {
                cache[step].variables[key].value = output[key];
                // pop off the csv column names and get the file data
                const subjectFiles = output[key][0][0].slice(1);
                subjectFiles.forEach((subjectFile) => {
                  // move to input dir
                  const fpLink = join(userDirectories.baseDirectory, subjectFile[0]);
                  const fpOut = join(userDirectories.outputDirectory, subjectFile[0]);
                  proms.push(
                    mkdirp(dirname(fpLink))
                      .then(() => hardLink(fpOut, fpLink))
                      .then(() => {
                        fpCleanup.push(fpLink);
                      })
                  );
                });
              } else if (cache[step].variables[key].type === 'files' || cache[step].variables[key].type === 'file') {
                cache[step].variables[key].value = output[key];
                const fileArray = Array.isArray(output[key]) ? output[key] : [output[key]];
                fileArray.forEach((file) => {
                  // move to input dir
                  const fpLink = join(userDirectories.baseDirectory, file);
                  const fpOut = join(userDirectories.outputDirectory, file);
                  proms.push(
                    mkdirp(dirname(fpLink))
                      .then(() => hardLink(fpOut, fpLink))
                      .then(() => fpCleanup.push(fpLink))
                      .then(() => {
                        fpCleanup.push(fpLink);
                      })
                  );
                });
              } else {
                cache[step].variables[key].value = output[key];
              }
            }
          }
          return Promise.all(proms);
        };
        // TODO: FP here
        const loadInput = (step) => {
          const output = {};
          for (let [key, val] of Object.entries(step.inputMap)) { // eslint-disable-line no-restricted-syntax, max-len, prefer-const
            if (val.fromCache) {
              output[key] = cache[val.fromCache.step].variables[val.fromCache.variable].value;
            } else {
              output[key] = val.value;
            }
          }
          return output;
        };
        const pipeineChain = pipelineSteps.reduce((prom, step, index) => {
          setStateProp('currentStep', index);
          // remote doesn't execute local steps but shares the same spec
          if (this.mode === 'remote' && step.controller.type === 'local') {
            return Promise.resolve();
          }
          return prom.then(() => {
            return step.start(this.mode === 'remote' ? {} : loadInput(step), remoteHandler);
          })
            .then((output) => {
              return loadCache(output, index)
                .then(() => {
                  return output;
                });
            });
        }, Promise.resolve());

        const cleanup = () => {
          return Promise.all(fpCleanup.map((file) => {
            // rmraf from the base file/dir
            return rimraf(join(
              userDirectories.baseDirectory,
              relative(userDirectories.baseDirectory, file).split(sep)[0]
            ))
            // unlink errors shouldnt crash the pipe
              .catch();
          }));
        };
        // cleanup
        return pipeineChain.then(finalOutput => cleanup().then(() => finalOutput))
          .catch((err) => {
            // cleanup and then rethrow pipeline error
            return cleanup().then(() => { throw err; });
          });
      },
    };
  },
};
