import { useMutation } from '@apollo/client';
import { ipcRenderer } from 'electron';
import { startsWith } from 'lodash';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { updateDockerOutput } from '../../../state/ducks/docker';
import { notifyError, notifySuccess } from '../../../state/ducks/notifyAndLog';
import { UPDATE_USER_CONSORTIUM_STATUS_MUTATION } from '../../../state/graphql/functions';

const DOCKER_IGNORABLE_MESSAGES = [
  'connect ECONNREFUSED',
  '(HTTP code 500) server error',
  'socket hang up',
  '(HTTP code 502) unexpected - Bad response from Docker engine',
  'connect ENOENT',
];

function DockerEventsListeners() {
  const dispatch = useDispatch();

  const [updateUserConsortiumStatus] = useMutation(UPDATE_USER_CONSORTIUM_STATUS_MUTATION);

  useEffect(() => {
    ipcRenderer.on('docker-out', (_, arg) => {
      dispatch(updateDockerOutput(arg));
    });

    ipcRenderer.on('docker-pull-complete', (_, arg) => {
      updateUserConsortiumStatus({
        variables: {
          consortiumId: arg,
          status: 'pipeline-computations-downloaded',
        },
      });
      dispatch(notifySuccess(`${arg} Pipeline Computations Downloaded`));
    });

    ipcRenderer.on('docker-error', (_, arg) => {
      const { message } = arg.err;

      const shouldNotify = DOCKER_IGNORABLE_MESSAGES.filter(
        startString => startsWith(message, startString),
      ).length === 0;

      if (shouldNotify) {
        dispatch(notifyError(`Docker Error: ${message}`));
      }
    });

    return () => {
      ipcRenderer.removeAllListeners('docker-out');
      ipcRenderer.removeAllListeners('docker-pull-complete');
      ipcRenderer.removeAllListeners('docker-error');
    };
  }, []);

  return null;
}

export default DockerEventsListeners;
