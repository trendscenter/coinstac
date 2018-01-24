'use strict';

import ipcPromise from 'ipc-promise';

export const startPipeline = (consortium) => // eslint-disable-line
  () =>
    ipcPromise.send('start-pipeline', consortium);
