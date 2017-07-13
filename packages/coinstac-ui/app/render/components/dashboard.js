import React, { Component } from 'react';
import PropTypes from 'prop-types';
import DashboardNav from './dashboard-nav';
import UserAccountController from './user-account-controller';
import { connect } from 'react-redux';
import * as bgServices from '../state/ducks/bg-services';
import { logUI } from '../state/ducks/util';

import CoinstacAbbr from './coinstac-abbr';

class Dashboard extends Component {

  componentDidMount() {
    const { dispatch, auth: { user } } = this.props;
    const { router } = this.context;

    process.nextTick(() => {
      if (!user) {
        logUI('verbose', 'Redirecting login (no authorized user)');
        router.push('/login');
      } else {
        dispatch(bgServices.initPrivateBackgroundServices());
      }
    });
  }

  render() {
    const { auth, children } = this.props;
    const { router } = this.context;

    if (!auth || !auth.user) {
      return (<p>Redirecting to login...</p>);
    }
    // @TODO don't render primary content whilst still loading/bg-services
    return (
      <div className="dashboard container-fluid">
        <div className="row">
          <div className="col-xs-12 col-sm-4">
            <nav className="navigation" role="navigation">
              <h1 className="logo text-center">
                <CoinstacAbbr />
              </h1>
              <DashboardNav />
              <UserAccountController push={router.push} />
            </nav>
          </div>
          <div className="col-xs-12 col-sm-8">
            {children}
          </div>
        </div>
      </div>
    );
  }
}

Dashboard.displayName = 'Dashboard';

Dashboard.contextTypes = {
  router: PropTypes.object,
};

Dashboard.propTypes = {
  auth: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};

function select(state) {
  return {
    auth: state.auth,
  };
}

export default connect(select)(Dashboard);
