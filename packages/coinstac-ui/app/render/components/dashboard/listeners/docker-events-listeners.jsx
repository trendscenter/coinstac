import { useEffect } from 'react';
import { connect } from 'react-redux';
import { graphql, withApollo } from '@apollo/client/react/hoc';
import { startsWith, flowRight as compose } from 'lodash';
import { ipcRenderer } from 'electron';
import PropTypes from 'prop-types';

import { notifyError, notifySuccess } from '../../../state/ducks/notifyAndLog';
import { updateDockerOutput } from '../../../state/ducks/docker';
import { UPDATE_USER_CONSORTIUM_STATUS_MUTATION } from '../../../state/graphql/functions';

const DOCKER_IGNORABLE_MESSAGES = [
  'connect ECONNREFUSED',
  '(HTTP code 500) server error',
  'socket hang up',
];

function DockerEventsListeners({
  updateDockerOutput, updateUserConsortiumStatus, notifySuccess, notifyError,
}) {
  useEffect(() => {
    ipcRenderer.on('docker-out', (_event, arg) => {
      updateDockerOutput(arg);
    });

    ipcRenderer.on('docker-pull-complete', (event, arg) => {
      updateUserConsortiumStatus(arg, 'pipeline-computations-downloaded');
      notifySuccess(`${arg} Pipeline Computations Downloaded`);
    });

    ipcRenderer.on('docker-error', (event, arg) => {
      const { message } = arg.err;

      const shouldNotify = DOCKER_IGNORABLE_MESSAGES.filter(
        startString => startsWith(message, startString)
      ).length === 0;

      if (shouldNotify) {
        notifyError(`Docker Error: ${message}`);
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

DockerEventsListeners.propTypes = {
  updateDockerOutput: PropTypes.func.isRequired,
  updateUserConsortiumStatus: PropTypes.func.isRequired,
};

const DockerEventsListenersWithData = compose(
  graphql(UPDATE_USER_CONSORTIUM_STATUS_MUTATION, {
    props: ({ mutate }) => ({
      updateUserConsortiumStatus: (consortiumId, status) => mutate({
        variables: { consortiumId, status },
      }),
    }),
  }),
  withApollo
)(DockerEventsListeners);

export default connect(null,
  {
    notifyError,
    notifySuccess,
    updateDockerOutput,
  })(DockerEventsListenersWithData);
