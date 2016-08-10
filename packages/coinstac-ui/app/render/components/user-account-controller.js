import app from 'ampersand-app';
import { connect } from 'react-redux';
import React, { Component, PropTypes } from 'react';

import { logout } from '../state/ducks/auth';
import UserAccount from './user-account';


class UserAccountController extends Component {
  constructor(props) {
    super(props);
    this.logout = this.logout.bind(this);
  }

  logout(evt) {
    const { dispatch } = this.props;
    const { router } = this.context;

    evt.preventDefault();

    dispatch(logout())
    .then(() => {
      router.push('/login');
      app.notify('success', 'Successfully logged out');
    })
    .catch(err => {
      app.logger.error(err);
      app.notify('error', 'Error logging out');
    });
  }

  render() {
    return (
      <UserAccount logout={this.logout} {...this.props} />
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
