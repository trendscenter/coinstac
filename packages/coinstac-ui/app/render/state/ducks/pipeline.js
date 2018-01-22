'use strict';

import ipcPromise from 'ipc-promise';

export const startPipeline = (consortium) =>
  dispatch =>
    ipcPromise.send('start-pipeline', compsAndConsortiumId)