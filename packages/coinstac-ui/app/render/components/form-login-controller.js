import app from 'ampersand-app';
import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import * as authActions from 'app/render/state/ducks/auth.js';
import FormLogin from './form-login';
import LayoutNoauth from './layout-noauth';

class FormLoginController extends Component {
  hotRoute() {
    const { dispatch } = this.props;
    const { router } = this.context;

    // warning - hot routing will grant access to the UI, however submitted
    // data will not be persisted/honored
    return dispatch(authActions.hotRoute())
    .then((user) => {
      process.nextTick(() => router.push('/'));
    });
  }

  submit(evt) {
    const { dispatch } = this.props;
    const { router } = this.context;
    const userCred = this.refs.logon.data();

    evt.preventDefault();

    dispatch(authActions.login(userCred))
      .then(user => {
        app.notifications.push({
          message: `Welcome, ${user.label}!`,
          level: 'success',
        });

        // TODO: Figure why `nextTick` is needed
        process.nextTick(() => router.push('/'));
      });
  }
  render() {
    const { loading } = this.props;
    const showHotRoute = app.config.get('env') === 'development';

    return (
      <LayoutNoauth>
        <FormLogin
          ref="logon"
          loading={loading}
          hotRoute={this.hotRoute.bind(this)}
          showHotRoute={showHotRoute}
          submit={this.submit.bind(this)}
        />
      </LayoutNoauth>
    );
  }
}

FormLoginController.contextTypes = {
  router: PropTypes.object.isRequired,
};

FormLoginController.displayName = 'FormLoginController';

FormLoginController.propTypes = {
  dispatch: PropTypes.func.isRequired,
  loading: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => {
  const { auth, loading } = state;
  return { auth, loading };
};

export default connect(mapStateToProps)(FormLoginController);
