import { difference, reduce, values } from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { Label } from 'react-bootstrap';
import { Link } from 'react-router';
import moment from 'moment';

import ConsortiumResultMeta from './consortium/consortium-result-meta.js';

function getWaitingOnUsers({
  usernames: allUsernames,
  pluginState: {
    'group-step': groupStep,
  },
}) {
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
  consortium,
  remoteResult,
}) {
  let heading;
  let indicator;
  let waitingOn;

  if (remoteResult.userErrors.length) {
    indicator = <Label bsStyle="danger">Error</Label>;
  } else if (remoteResult.complete) {
    indicator = <Label bsStyle="success">Complete</Label>;
  } else {
    indicator = <Label bsStyle="default">In Progress</Label>;
  }

  if (remoteResult && !remoteResult.complete) {
    const waitingOnUsers = getWaitingOnUsers(remoteResult);

    if (waitingOnUsers.length) {
      waitingOn = (
        <li>
          <strong>Waiting on:</strong>
          {' '}
          {waitingOnUsers.join(', ')}
        </li>
      );
    }
  }

  if (remoteResult.endDate) {
    heading = `Ended ${moment(remoteResult.endDate).fromNow()}`;
  } else {
    heading = `Started ${moment(remoteResult.startDate).fromNow()}`;
  }

  return (
    <div className="consortium-status panel panel-default">
      <div className="panel-heading">
        <h3 className="panel-title h4">
          {heading}
          {' '}
          {indicator}
        </h3>
      </div>
      <div className="panel-body">
        <ul className="list-unstyled">
          <li>
            <strong>Consortium:</strong>
            {' '}
            <Link to={`/consortia/${consortium._id}`}>{consortium.label}</Link>
          </li>
          {waitingOn}
        </ul>
        <ConsortiumResultMeta
          computation={computation}
          computationInputs={remoteResult.computationInputs}
          step={remoteResult.pluginState['group-step'].step}
          usernames={remoteResult.usernames}
        />
      </div>
    </div>
  );
}

StatusItem.propTypes = {
  consortium: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
  }).isRequired,
  computation: PropTypes.shape({
    name: PropTypes.string.isRequired,
    version: PropTypes.string.isRequired,
  }).isRequired,
  remoteResult: PropTypes.shape({
    computationInputs: PropTypes.arrayOf(PropTypes.array).isRequired,
    endDate: PropTypes.number,
    pipelineState: PropTypes.shape({
      step: PropTypes.number.isRequired,
    }).isRequired,
    pluginState: PropTypes.shape({
      'group-step': PropTypes.object,
    }),
    startDate: PropTypes.number.isRequired,
    usernames: PropTypes.arrayOf(PropTypes.string).isRequired,
  }),
};
