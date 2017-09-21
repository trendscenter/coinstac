/* eslint-disable react/no-array-index-key */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Alert } from 'react-bootstrap';
import { connect } from 'react-redux';
import { graphql } from 'react-apollo';
import StatusItem from './status-item';
// import { fetchComputations } from '../state/ducks/computations';
import { fetchComputationMetadata } from '../state/graphql-queries';

/* import {
  fetchRemoteResultsForUser,
} from '../state/ducks/results';
*/

class DashboardHome extends Component {
  constructor(props) {
    super(props);

    this.state = {
      didInitResults: false,
    };
  }

/*
  componentWillMount() {
    const {
      // fetchRemoteResultsForUser,
      username,
    } = this.props;

    this.interval = setInterval(() => fetchRemoteResultsForUser(username), 2000);
  }
*/

/*
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
      this.setState({ didInitResults: true }, () => { // eslint-disable-line
        fetchRemoteResultsForUser(username);
      });
    }
  }
  */

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
        <div className="page-header clearfix">
          <h1 className="pull-left">Computation Statuses</h1>
        </div>
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
  computations: PropTypes.arrayOf(PropTypes.object),
  consortia: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string.isRequired,
    owners: PropTypes.arrayOf(PropTypes.string).isRequired,
    users: PropTypes.arrayOf(PropTypes.string).isRequired,
  })),
  // fetchRemoteResultsForUser: PropTypes.func.isRequired,
  remoteResults: PropTypes.arrayOf(PropTypes.object),
  username: PropTypes.string,
};

DashboardHome.defaultProps = {
  computations: [],
  username: null,
  remoteResults: [],
};

function mapStateToProps({
  auth,
  consortia: { allConsortia },
  // computations: { allComputations },
  results: { remoteResults },
  projects: { allProjects },
}) {
  return {
    consortia: allConsortia || [],
    // computations: allComputations || [],
    projects: allProjects || [],
    remoteResults: remoteResults || [],
    username: auth.user.username,
  };
}

const DashHomeWithData = graphql(fetchComputationMetadata, {
  props: ({ data: { loading, fetchAllComputations } }) => ({
    loading,
    computations: fetchAllComputations,
  }),
})(DashboardHome);

export default connect(mapStateToProps)(DashHomeWithData);
