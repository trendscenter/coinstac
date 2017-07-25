/* eslint-disable react/no-array-index-key */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Alert } from 'react-bootstrap';
import { connect } from 'react-redux';
import StatusItem from './status-item';
import { fetchComputations } from '../state/ducks/computations';
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
    const {
      computations,
      fetchComputations,
      fetchRemoteResultsForUser,
      username,
    } = this.props;

    if (!computations.length) {
      fetchComputations();
    }

    this.interval = setInterval(() => fetchRemoteResultsForUser(username), 2000);
  }

  componentWillUpdate() {
    const {
      computations,
      consortia,
      fetchRemoteResultsForUser,
      username,
    } = this.props;

    if (
      !this.state.didInitResults &&
      computations.length &&
      consortia.length &&
      username
    ) {
      this.setState({ didInitResults: true }, () => { //eslint-disable-line
        fetchRemoteResultsForUser(username);
      });
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
          {remoteResults.map(res => (
            <li key={res.startDate}>
              <StatusItem
                computation={res.computation}
                consortium={res.consortium}
                remoteResult={res}
              />
            </li>
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
  fetchComputations: PropTypes.func.isRequired,
  fetchRemoteResultsForUser: PropTypes.func.isRequired,
  remoteResults: PropTypes.arrayOf(PropTypes.object),
  username: PropTypes.string,
};

DashboardHome.defaultProps = {
  username: null,
  remoteResults: [],
};

function mapStateToProps({
  auth,
  computations: { allComputations },
  consortia,
  projects: { allProjects },
  remoteResults,
}) {
  return {
    computations: allComputations || [],
    consortia: consortia || [],
    projects: allProjects || [],
    remoteResults: remoteResults || [],
    username: auth.user.username,
  };
}

export default connect(mapStateToProps, {
  fetchComputations,
  fetchRemoteResultsForUser,
})(DashboardHome);
