import app from 'ampersand-app';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { hotRoute, login } from '../state/ducks/auth.js';
import FormLogin from './form-login';
import LayoutNoauth from './layout-noauth';

class FormLoginController extends Component {
  constructor(props) {
    super(props);
    this.hotRoute = this.hotRoute.bind(this);
    this.submit = this.submit.bind(this);
  }

  hotRoute() {
    const { router } = this.context;

    // warning - hot routing will grant access to the UI, however submitted
    // data will not be persisted/honored
    return this.props.hotRoute()
    .then(() => {
      process.nextTick(() => router.push('/'));
    });
  }

  submit(evt) {
    const { router } = this.context;
    const userCred = this.refs.logon.data();

    evt.preventDefault();

    this.props.login(userCred)
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
          ref="logon"
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
  hotRoute: PropTypes.func,
  loading: PropTypes.object.isRequired,
  login: PropTypes.func,
};

const mapStateToProps = (state) => {
  const { auth, loading } = state;
  return { auth, loading };
};

export default connect(mapStateToProps, {
  hotRoute,
  login,
})(FormLoginController);
