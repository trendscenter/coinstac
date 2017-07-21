/* eslint-disable react/no-array-index-key */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Alert } from 'react-bootstrap';
import { connect } from 'react-redux';
// import { logger, notify } from 'ampersand-app';
import StatusItem from './status-item';
import { fetchComputations } from '../state/ducks/computations.js';
import {
  fetchRemoteResultsForUser,
} from '../state/ducks/remote-results';

class DashboardHome extends Component {
  constructor(props) {
    super(props);

    this.state = {
      didInitResults: false,
    };
  }

  componentWillMount() {
    const { computations, dispatch, username } = this.props;

    if (!computations.length) {
      dispatch(fetchComputations());
    }

    this.interval = setInterval(() => dispatch(fetchRemoteResultsForUser(username)), 5000);
  }

  componentWillUpdate() {
    const {
      computations,
      consortia,
      dispatch,
      // Projects don't seem to be used-- projects,
      username,
    } = this.props;

    if (
      !this.state.didInitResults &&
      computations.length &&
      consortia.length &&
      // Projects don't seem to be used-- projects.length &&
      username
    ) {
      this.setState({ didInitResults: true });
      dispatch(fetchRemoteResultsForUser(username));
    }
  }

  componentWillUnmount() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  render() {
    const {
      remoteResults,
    } = this.props;

    return (
      <div className="dashboard-home">
        <h1 className="h2">Computation statuses:</h1>
        {!remoteResults.length &&
          <Alert>No computation results</Alert>
        }
        <ul className="list-unstyled">
          {remoteResults.map((res) =>
            <li key={res.startDate}>
              <StatusItem
                computation={res.computation}
                consortium={res.consortium}
                remoteResult={res}
              />
            </li>
          )}
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

DashboardHome.defaultProps = {
  username: null,
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
