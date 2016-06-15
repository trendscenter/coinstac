'use strict';
import React, { Component, PropTypes } from 'react';
import DashboardNav from './dashboard-nav';
import UserAccountController from './user-account-controller';
import { connect } from 'react-redux';
import * as bgServices from 'app/render/state/ducks/bg-services';
import app from 'ampersand-app';
import noop from 'lodash/noop';

class Dashboard extends Component {

  componentDidMount() {
    const { dispatch, auth: { user } } = this.props;
    const { router } = this.context;

    process.nextTick(() => {
      if (!user) {
        app.logger.verbose('Redirecting login (no authorized user)');
        router.push('/login');
      } else {
        dispatch(bgServices.initPrivateBackgroundServices());
      }
    });
  }

  render() {
    const { auth, children } = this.props;
    const { router } = this.context;
    const title = [
      'Collaborative Informatics and Neuroimaging Suite Toolkit',
      'for Anonymous Computation',
    ].join(' ');

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
                <abbr title={title}>COINSTAC</abbr>
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
  router: React.PropTypes.object,
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
