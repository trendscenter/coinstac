import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Alert } from 'react-bootstrap';
import { connect } from 'react-redux';
import { logger, notify } from 'ampersand-app';

import StatusItem from './status-item.js';
import { fetch as fetchProjects } from '../state/ducks/projects.js';
import { fetchComputations } from '../state/ducks/computations.js';
import { fetch as fetchResults } from '../state/ducks/remote-results';

class DashboardHome extends Component {
  componentWillMount() {
    const { computations, dispatch } = this.props;

    dispatch(fetchResults());

    if (!computations.length) {
      dispatch(fetchComputations());
    }

    // TODO: Modify action creator to use Promise
    dispatch(fetchProjects((error) => {
      if (error) {
        logger.error(error);
        notify('error', error.message);
      }
    }));
  }

  maybeRenderStatusItem({ computation, consortium, remoteResult }) {
    const isMember = consortium.users.indexOf(this.props.username) > -1;

    if (isMember) {
      return (
        <StatusItem
          computation={computation}
          consortium={consortium}
          remoteResult={remoteResult}
        />
      );
    }
  }

  render() {
    const {
      computations,
      consortia,
      projects,
      username,
      remoteResults,
    } = this.props;
    let statusItems = [];

    if (
      remoteResults.length &&
      computations.length &&
      consortia.length &&
      username
    ) {
      Array.prototype.push.apply(
        statusItems,
        remoteResults.reduce((memo, remoteResult) => {
          const computation = computations.find(
            ({ _id }) => _id === remoteResult.computationId
          );
          const consortium = consortia.find(
            ({ _id }) => _id === remoteResult.consortiumId
          );
          const project = projects.find(
            ({ consortiumId }) => consortiumId === consortium._id
          );
          const isMember = consortium.users.indexOf(username) > -1;

          if (isMember) {
            return memo.concat(this.maybeRenderStatusItem({
              computation,
              consortium,
              project,
              remoteResult,
            }));
          }

          return memo;
        }, [])
      );
    }

    if (!statusItems.length) {
      statusItems = [<Alert>No computation results</Alert>];
    }

    return (
      <div className="dashboard-home">
        <h1 className="h2">Computation statuses:</h1>
        <ul className="list-unstyled">
          {statusItems.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
    );
  }
}

DashboardHome.propTypes = {
  computations: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    version: PropTypes.string.isRequired,
  })).isRequired,
  consortia: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string.isRequired,
    owners: PropTypes.arrayOf(PropTypes.string).isRequired,
    users: PropTypes.arrayOf(PropTypes.string).isRequired,
  })).isRequired,
  dispatch: PropTypes.func.isRequired,
  projects: PropTypes.arrayOf(PropTypes.shape({
    allowComputationRun: PropTypes.bool.isRequired,
    consortiumId: PropTypes.string.isRequired,
    status: PropTypes.oneOf([
      'active',
      'complete',
      'error',
      'waiting',
    ]).isRequired,
  })).isRequired,
  remoteResults: PropTypes.arrayOf(PropTypes.object),
  username: PropTypes.string,
};

function mapStateToProps({
  auth,
  computations,
  consortia,
  projects,
  remoteResults,
}) {
  return {
    computations: computations || [],
    consortia: consortia || [],
    projects: projects || [],
    remoteResults: remoteResults || [],
    username: auth.user.username,
  };
}

export default connect(mapStateToProps)(DashboardHome);
