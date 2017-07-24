import app from 'ampersand-app';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as authActions from '../state/ducks/auth';
import FormLogin from './form-login';
import LayoutNoauth from './layout-noauth';

class FormLoginController extends Component {
  constructor(props) {
    super(props);
    this.hotRoute = this.hotRoute.bind(this);
    this.submit = this.submit.bind(this);
  }

  hotRoute() {
    const { dispatch } = this.props;
    const { router } = this.context;

    // warning - hot routing will grant access to the UI, however submitted
    // data will not be persisted/honored
    return dispatch(authActions.hotRoute())
    .then(() => {
      process.nextTick(() => router.push('/'));
    });
  }

  submit(evt) {
    const { dispatch } = this.props;
    const { router } = this.context;
    const userCred = this.formLogon.data();

    evt.preventDefault();

    dispatch(authActions.login(userCred))
      .then(() => {
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
          ref={(c) => { this.formLogon = c; }}
          loading={loading}
          hotRoute={this.hotRoute}
          showHotRoute={showHotRoute}
          submit={this.submit}
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
