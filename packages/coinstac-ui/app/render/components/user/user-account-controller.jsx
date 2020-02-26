import { connect } from 'react-redux';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { notifySuccess, notifyError, writeLog } from '../../state/ducks/notifyAndLog';
import { logout } from '../../state/ducks/auth';
import UserAccount from './user-account';


class UserAccountController extends Component {
  constructor(props) {
    super(props);
    this.logoutUser = this.logoutUser.bind(this);
  }

  logoutUser(evt) {
    const { router } = this.context;

    evt.preventDefault();

    this.props.logout()
    .then(() => {
      router.push('/login');
      this.props.notifySuccess({
        message: 'Successfully logged out',
      });
    })
    .catch((err) => {
      this.props.writeLog({ type: 'error', message: err });
      this.props.notifyError({
        message: 'Error logging out',
      });
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

const mapStateToProps = ({ auth: { user } }) => {
  return { user };
};

export default connect(mapStateToProps, {
  logout,
  notifyError,
  notifySuccess,
  writeLog,
})(UserAccountController);
