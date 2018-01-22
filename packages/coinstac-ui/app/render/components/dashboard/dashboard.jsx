import { connect } from 'react-redux';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import DashboardNav from './dashboard-nav';
import UserAccountController from '../user/user-account-controller';
import { writeLog } from '../../state/ducks/notifyAndLog';
import CoinstacAbbr from '../coinstac-abbr';

class Dashboard extends Component {
  componentDidMount() {
    const { auth: { user } } = this.props;
    const { router } = this.context;

    process.nextTick(() => {
      if (!user.email.length) {
        this.props.writeLog({ type: 'verbose', message: 'Redirecting login (no authorized user)' });
        router.push('/login');
      } else {
        // this.props.initPrivateBackgroundServices();
      }
    });
  }

  render() {
    const { auth, children } = this.props;
    const { router } = this.context;

    if (!auth || !auth.user.email.length) {
      return (<p>Redirecting to login...</p>);
    }

    // @TODO don't render primary content whilst still loading/bg-services
    return (
      <div className="dashboard container-fluid">
        <div className="row">
          <div className="col-xs-12 col-sm-3 navigation-pane">
            <nav className="navigation">
              <h1 className="logo text-center">
                <CoinstacAbbr />
              </h1>
              <DashboardNav auth={auth} />
              <UserAccountController push={router.push} />
            </nav>
          </div>
          <div className="col-xs-12 col-sm-9 content-pane">
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
  writeLog: PropTypes.func.isRequired,
};

function mapStateToProps({ auth }) {
  return {
    auth,
  };
}

export default connect(mapStateToProps, { writeLog })(Dashboard);
