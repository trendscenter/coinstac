'use strict';

import ipcPromise from 'ipc-promise';
import { applyAsyncLoading } from './loading';

export const startPipeline = (consortium) =>
  dispatch =>
    ipcPromise.send('start-pipeline', compsAndConsortiumId)