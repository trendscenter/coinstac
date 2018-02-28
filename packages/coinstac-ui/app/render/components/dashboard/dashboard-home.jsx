/* eslint-disable react/no-array-index-key */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Alert } from 'react-bootstrap';
import { connect } from 'react-redux';
import StatusItem from '../status-item';
import { initTestData } from '../../state/ducks/collections';
import { clearRuns } from '../../state/ducks/runs';

class DashboardHome extends Component {
  constructor(props) {
    super(props);

    this.state = {
      didInitResults: false,
    };
  }

  componentDidMount() {
    this.props.clearRuns();
    this.props.initTestData();
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
  clearRuns: PropTypes.func.isRequired,
  initTestData: PropTypes.func.isRequired,
  username: PropTypes.string,
};

DashboardHome.defaultProps = {
  computations: [],
  username: null,
  remoteResults: [],
};

function mapStateToProps({
  auth,
}) {
  return {
    username: auth.user.username || '',
  };
}

export default connect(mapStateToProps, { clearRuns, initTestData })(DashboardHome);
