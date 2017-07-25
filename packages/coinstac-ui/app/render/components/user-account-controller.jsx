import app from 'ampersand-app';
import { connect } from 'react-redux';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { logout } from '../state/ducks/auth';
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
      app.notify({
        level: 'success',
        message: 'Successfully logged out',
      });
    })
    .catch((err) => {
      app.logger.error(err);
      app.notify({
        level: 'error',
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
};

const mapStateToProps = ({ auth }) => {
  let user = auth.user;

  // if auth is gone, we're probably logging out, use prev state
  if (typeof app.core.auth === 'object') {
    if ('getUser' in app.core.auth) {
      if (app.core.auth.getUser instanceof Function) {
        user = app.core.auth.getUser();
      }
    }
  }

  return {
    auth,
    user,
  };
};

export default connect(mapStateToProps, {
  logout,
})(UserAccountController);
