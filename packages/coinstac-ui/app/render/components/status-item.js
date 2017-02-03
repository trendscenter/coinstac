import { difference, reduce, values } from 'lodash';
import React, { Component, PropTypes } from 'react';
import { Button, Panel } from 'react-bootstrap';
import { Link } from 'react-router';

export default class StatusItem extends Component {
  getWaitingOnUsers() {
    const {
      remoteResult: {
        usernames: allUsernames,
        pluginState: {
          'group-step': groupStep,
        },
      },
    } = this.props;
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

  maybeRenderButton() {
    const {
      allowRun,
      runComputation,
      showRunButton,
    } = this.props;

    if (showRunButton) {
      return (
        <Button
          bsStyle="primary"
          disabled={!allowRun}
          onClick={runComputation}
        >
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
  }

  renderStatus() {
    const { status } = this.props;
    let className = 'project-status';
    let icon;
    let text;

    switch (status) {
      case 'active':
        className += ' is-active text-muted';
        icon = 'refresh';
        text = 'Running';
        break;
      case 'complete':
        className += ' text-success';
        icon = 'ok';
        text = 'Complete';
        break;
      case 'error':
        className += ' text-danger';
        icon = 'alert';
        text = 'Error';
        break;
      case 'waiting':
        className += ' text-muted';
        icon = 'alert';
        text = 'Waiting to start';
        break;
      default:
        icon = 'question-sign';
        text = 'Unknown status';
    }

    return (
      <div className={className}>
        <span>
          <span aria-hidden="true" className={`glyphicon glyphicon-${icon}`}></span>
          {' '}
          {text}
        </span>
      </div>
    );
  }

  render() {
    const {
      computation,
      consortium,
      remoteResult,
    } = this.props;

    let iteration;
    let waitingOn;
    let users;

    if (computation.name === 'laplacian-noise-ridge-regression' && remoteResult) {
      iteration = (
        <li>
          <strong>Iteration:</strong>
          {' '}
          {remoteResult.pluginState['group-step'].step}
          <span className="text-muted">
            /{remoteResult.pluginState.inputs[0][1]}
          </span>
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

      const waitingOnUsers = this.getWaitingOnUsers();

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

    return (
      <Panel className="consortium-status">
        <ul className="list-unstyled">
          <li><strong>Status:</strong>{' '}{this.renderStatus()}</li>
          <li>
            <strong>Consortium:</strong>
            {' '}
            <Link to={`/consortia/${consortium._id}`}>{consortium.label}</Link>
          </li>
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
}

StatusItem.propTypes = {
  allowRun: PropTypes.bool.isRequired,
  consortium: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
  }).isRequired,
  computation: PropTypes.shape({
    name: PropTypes.string.isRequired,
    version: PropTypes.string.isRequired,
  }).isRequired,
  remoteResult: PropTypes.shape({
    pipelineState: PropTypes.shape({
      step: PropTypes.number.isRequired,
    }).isRequired,
    pluginState: PropTypes.shape({
      'group-step': PropTypes.object,
    }),
    usernames: PropTypes.arrayOf(PropTypes.string).isRequired,
  }),
  runComputation: PropTypes.func.isRequired,
  showRunButton: PropTypes.bool.isRequired,
  status: PropTypes.oneOf([
    'active',
    'complete',
    'error',
    'waiting',
  ]).isRequired,
};
