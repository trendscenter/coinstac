'use strict';

import ipcPromise from 'ipc-promise';

export const startPipeline = consortium => () => ipcPromise.send('start-pipeline', consortium);
