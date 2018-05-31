/* eslint-disable react/no-array-index-key */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import RunsList from '../common/runs-list';

const HOURS_SINCE_ACTIVE = 72;

class DashboardHome extends Component {
  constructor(props) {
    super(props);

    this.state = {
      didInitResults: false,
    };
  }

  componentWillUnmount() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  render() {
    const {
      consortia, runs, userId,
    } = this.props;

    return (
      <div>
        <div className="page-header clearfix">
          <h1 className="pull-left">{userId}&apos;s Home</h1>
        </div>
        <h3>Run Activity in the Last {HOURS_SINCE_ACTIVE} Hours</h3>
        <RunsList
          consortia={consortia}
          hoursSinceActive={HOURS_SINCE_ACTIVE}
          limitToComplete={false}
          runs={runs}
        />
      </div>
    );
  }
}

DashboardHome.propTypes = {
  consortia: PropTypes.array.isRequired,
  runs: PropTypes.array.isRequired,
  userId: PropTypes.string.isRequired,
};

DashboardHome.defaultProps = {
  userId: '',
};

function mapStateToProps({ auth: { user: { id } }, runs: { runs } }) {
  return { runs, userId: id };
}

export default connect(mapStateToProps)(DashboardHome);
