import { connect } from 'react-redux';
import app from 'ampersand-app';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import DashboardNav from './dashboard-nav';
import UserAccountController from './user-account-controller';
// import { initPrivateBackgroundServices } from '../state/ducks/bg-services';
import CoinstacAbbr from './coinstac-abbr';

class Dashboard extends Component {

  componentDidMount() {
    const { auth: { user } } = this.props;
    const { router } = this.context;

    process.nextTick(() => {
      if (!user) {
        app.logger.verbose('Redirecting login (no authorized user)');
        router.push('/login');
      } else {
        // this.props.initPrivateBackgroundServices();
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
            <nav className="navigation">
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
  children: PropTypes.node.isRequired,
  // initPrivateBackgroundServices: PropTypes.func.isRequired,
};

function mapStateToProps({ auth }) {
  return {
    auth,
  };
}

export default connect(mapStateToProps)(Dashboard);
