const WS = require('ws');
const utils = require('../utils');

/**
 * Calls the WS server inside the container
 * with data format:
 * [{command}, {args}, {inputData}]
 * @param  {Array} data  service data to run
 * @return {Promise}     resolves or rejects from service run
 */
const ServiceFunctionGenerator = ({
  host = '127.0.0.1',
  port,
  compspecVersion = 1,
}) => {
  return ({
    input,
    mode,
    command,
  }) => {
    let proxR;
    let proxRj;
    let wsProm;
    const prox = new Promise((resolve, reject) => {
      proxR = resolve;
      proxRj = reject;
    });
    switch (compspecVersion) {
      case 1: {
        const serviceCommand = JSON.stringify({
          command: command[0],
          args: command.slice(1),
        });
        const serviceInput = JSON.stringify(input);
        wsProm = new Promise((resolve) => {
          let count = 0;
          const testConnection = () => {
            const ws = new WS(`ws://${host}:${port}`);
            ws.on('open', () => {
              ws.close(1000, 'Test Connection');
              resolve();
            });
            ws.on('error', (e) => {
              if (e.code && (e.code === 'ECONNRESET' || e.code === 'ECONNREFUSED')) {
                ws.terminate();
                if (count > 10) {
                  proxRj(new Error('Container websocket server timeout exceeded'));
                } else {
                  count += 1;
                  setTimeout(testConnection, 200 * count);
                }
              } else {
                proxRj(e);
              }
            });
          };
          testConnection();
        }).then(() => {
          const ws = new WS(`ws://${host}:${port}`);
          ws.on('open', () => {
            ws.send(serviceCommand);
            utils.logger.debug(`Input data size: ${serviceInput.length}`);
            ws.send(serviceInput);
            ws.send(null);
          });
          ws.on('close', (code, reason) => {
            if (code !== 1000) proxRj(new Error(`Abnormal Container websocket close: ${reason}`));
          });
          ws.on('error', (e) => {
            proxRj(e);
          });
          return new Promise((resolve, reject) => {
            let stdout = '';
            let stderr = '';
            let outfin = false;
            let errfin = false;
            let code;
            ws.on('message', (data) => {
              let res;
              try {
                res = JSON.parse(data);
              } catch (e) {
                ws.close(1011, 'Data parse error');
                return reject(e);
              }
              switch (res.type) {
                case 'error':
                  ws.close(1011, 'Computation start error');
                  return reject(res.error);
                case 'stderr':
                  errfin = res.end;
                  stderr += res.data || '';
                  if (code !== undefined && outfin && errfin) {
                    ws.close(1000, 'Normal Client disconnect');
                    resolve({
                      code,
                      stdout,
                      stderr,
                    });
                  }
                  break;
                case 'stdout':
                  outfin = res.end;
                  stdout += res.data || '';
                  if (code !== undefined && outfin && errfin) {
                    ws.close(1000, 'Normal Client disconnect');
                    resolve({
                      code,
                      stdout,
                      stderr,
                    });
                  }
                  break;
                case 'close':
                  ({ code } = res);
                  if (outfin && errfin) {
                    ws.close(1000, 'Normal Client disconnect');
                    resolve({
                      code,
                      stdout,
                      stderr,
                    });
                  }
                  break;
                default:
              }
            });
          }).then((output) => {
            utils.logger.debug('Container service call finished');
            if (output.code !== 0) {
              throw new Error(`Computation failed with exitcode ${output.code} and stderr ${output.stderr}`);
            }
            utils.logger.debug(`Output size: ${output.stdout.length}`);

            let error;
            try {
              const parsed = JSON.parse(output.stdout);
              proxR(parsed);
            } catch (e) {
              error = e;
              utils.logger.error(`Computation output serialization failed with value: ${JSON.stringify(output)}`);
              error.message = `${error.message}\n Additional computation failure information:\n
              Error code: ${output.code}\n
              Stderr: ${output.stderr}
              `;
              error.error = `${error.error}\n Additional computation failure information:\n
              Error code: ${output.code}\n
              Stderr: ${output.stderr}
              `;
              throw error;
            }
          }).catch((e) => {
            proxRj(e);
          });
        });

        break;
      }
      case 2:
        wsProm = new Promise((resolve) => {
          let count = 0;
          const testConnection = () => {
            const ws = new WS(`ws://${host}:${port}`);
            ws.on('open', () => {
              ws.close(1000, 'Test Connection');
              resolve();
            });
            ws.on('error', (e) => {
              if (e.code && (e.code === 'ECONNRESET' || e.code === 'ECONNREFUSED')) {
                ws.terminate();
                if (count > 10) {
                  proxRj(new Error('Container websocket server timeout exceeded'));
                } else {
                  count += 1;
                  setTimeout(testConnection, 200 * count);
                }
              } else {
                proxRj(e);
              }
            });
          };
          testConnection();
        }).then(() => {
          const ws = new WS(`ws://${host}:${port}`);
          ws.on('open', () => {
            // this object is coupled to the coinstac language utilities lib
            ws.send(JSON.stringify({
              mode,
              data: input,
            }));
          });
          ws.on('error', (e) => {
            proxRj(e);
          });
          ws.on('close', (code, reason) => {
            if (code !== 1000) proxRj(new Error(`Abnormal Container websocket close: ${reason}`));
          });
          return new Promise((resolve, reject) => {
            let stdout = '';
            let stderr = '';
            let outfin = false;
            let errfin = false;
            let code;
            ws.on('message', (data) => {
              let res;
              try {
                res = JSON.parse(data);
              } catch (e) {
                ws.close(1011, 'Data parse error');
                return reject(e);
              }
              switch (res.type) {
                case 'error':
                  ws.close(1011, 'Computation start error');
                  return reject(res.error);
                case 'stderr':
                  errfin = res.end;
                  stderr += res.data || '';
                  code = res.code || code;
                  if (res.code !== undefined && errfin) {
                    ws.close(1000, 'Normal Client disconnect');
                    resolve({
                      code,
                      stdout,
                      stderr,
                    });
                  }
                  break;
                case 'stdout':
                  outfin = res.end;
                  stdout = res.data || '';
                  if (outfin) {
                    ws.close(1000, 'Normal Client disconnect');
                    resolve({
                      code: 0,
                      stdout,
                      stderr: '',
                    });
                  }
                  break;
                case 'close':
                  code = res.code || code;
                  if (outfin && errfin) {
                    ws.close(1000, 'Normal Client disconnect');
                    resolve({
                      code,
                      stdout,
                      stderr,
                    });
                  }
                  break;
                default:
              }
            });
          }).then((output) => {
            utils.logger.debug('Container service call finished');
            if (output.code !== 0) {
              throw new Error(`Computation failed with exitcode ${output.code} and stderr ${output.stderr}`);
            }
            proxR(output.stdout);
          }).catch((e) => {
            proxRj(e);
          });
        });
        break;
      default:
        proxRj(new Error('Invalid compspeccompspecVersion'));
    }
    // promise fullfilled by container output
    return wsProm.then(() => prox);
  };
};

module.exports = {
  ServiceFunctionGenerator,
};
