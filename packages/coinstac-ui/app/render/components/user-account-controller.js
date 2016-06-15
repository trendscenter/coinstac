import { connect } from 'react-redux';
import React, { Component, PropTypes } from 'react';

import { logout } from 'app/render/state/ducks/auth';
import app from 'ampersand-app';
import UserAccount from './user-account';


class UserAccountController extends Component {

  logout(evt) {
    const { dispatch } = this.props;
    const { router } = this.context;

    evt.preventDefault();

    dispatch(logout())
    .then(() => {
      router.push('/login');
      app.notify('success', 'Successfully logged out');
    })
    .catch((err) => {
      app.notify('error', 'Error logging out');
    });
  }

  render() {
    return (
      <UserAccount logout={this.logout.bind(this)} { ...this.props } />
    );
  }

}

UserAccountController.contextTypes = {
  router: PropTypes.object.isRequired,
};

UserAccountController.displayName = 'UserAccountController';

UserAccountController.propTypes = {
  push: PropTypes.func.isRequired,
  dispatch: PropTypes.func.isRequired,
};

function select(state) {
  return {
    auth: state.auth,
    user: app.core.auth.getUser(),
  };
}

export default connect(select)(UserAccountController);
