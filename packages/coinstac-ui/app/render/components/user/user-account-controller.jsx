import { connect } from 'react-redux';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { notifySuccess, notifyError, writeLog } from '../../state/ducks/notifyAndLog';
import { logout } from '../../state/ducks/auth';
import UserAccount from './user-account';


class UserAccountController extends Component {
  logoutUser = (evt) => {
    const { router } = this.context;
    const {
      logout, notifySuccess, notifyError, writeLog,
    } = this.props;

    evt.preventDefault();

    logout()
      .then(() => {
        router.push('/login');
        notifySuccess('Successfully logged out');
      })
      .catch((err) => {
        writeLog({ type: 'error', message: err });
        notifyError('Error logging out');
      });
  }

  render() {
    return (
      <UserAccount logoutUser={this.logoutUser} {...this.props} />
    );
  }
}

UserAccountController.contextTypes = {
  router: PropTypes.object.isRequired,
};

UserAccountController.displayName = 'UserAccountController';

UserAccountController.propTypes = {
  logout: PropTypes.func.isRequired,
  notifyError: PropTypes.func.isRequired,
  notifySuccess: PropTypes.func.isRequired,
  writeLog: PropTypes.func.isRequired,
};

export default connect(null, {
  logout,
  notifyError,
  notifySuccess,
  writeLog,
})(UserAccountController);
