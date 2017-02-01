import React, { PropTypes } from 'react';
import { Button, Panel } from 'react-bootstrap';
import { difference, reduce, values } from 'lodash';

function getWaitingOnUsers(allUsernames, groupStep) {
  const currentUsernames = Object.keys(groupStep.userStep);
  const currentStep = groupStep.step;

  if (allUsernames.length !== Object.keys(groupStep.userStep).length) {
    return difference(allUsernames, currentUsernames);
  } else if (values(groupStep.userStep).some(step => step !== currentStep)) {
    return reduce(groupStep.userStep, (memo, step, username) => (
      step !== currentStep ? memo.concat(username) : memo
    ), []);
  }

  return [];
}

export default function StatusItem({
  computation,
  isOwner,
  status,
  remoteResult,
}) {
  const waitingOnUsers = getWaitingOnUsers(
    remoteResult.usernames,
    remoteResult.pluginState['group-step']
  );
  let button;
  let iteration;
  let waitingOn;
  let users;

  if (isOwner && status === 'ready') {
    button = (
      <Button bsStyle="primary">
        <span
          className="glyphicon glyphicon-repeat"
          aria-hidden="true"
        >
        </span>
        {' '}
        Run Computation
      </Button>
    );
  }

  if (computation.name === 'laplacian-noise-ridge-regression' && remoteResult) {
    iteration = (
      <li>
        <strong>Iteration:</strong>
        {' '}
        {remoteResult.pipelineState.step}
      </li>
    );
  }

  if (waitingOnUsers.length) {
    waitingOn = (
      <li>
        <strong>Waiting on:</strong>
        {' '}
        {waitingOnUsers.join(', ')}
      </li>
    );
  }

  if (remoteResult) {
    users = (
      <section>
        <h3 className="h5">Users</h3>
        <p>{remoteResult.usernames.join(', ')}</p>
      </section>
    );
  }

  return (
    <Panel className="consortium-status">
      <h2 className="h4">Status</h2>

      <p>{status}</p>

      {button}

      <ul className="list-unstyled">
        <li>
          <strong>Computation:</strong>
          {' '}
          {computation.name}
          {' '}
          <span className="text-muted">(Version {computation.version})</span>
        </li>
        {iteration}
        {waitingOn}
      </ul>

      {users}
    </Panel>
  );
}

StatusItem.propTypes = {
  computation: PropTypes.shape({
    name: PropTypes.string.isRequired,
    version: PropTypes.string.isRequired,
  }).isRequired,
  isOwner: PropTypes.bool.isRequired,
  status: PropTypes.string.isRequired,
  remoteResult: PropTypes.shape({
    pipelineState: PropTypes.shape({
      step: PropTypes.number.isRequired,
    }).isRequired,
    pluginState: PropTypes.shape({
      'group-step': PropTypes.object,
    }),
    usernames: PropTypes.arrayOf(PropTypes.string).isRequired,
  }),
};

