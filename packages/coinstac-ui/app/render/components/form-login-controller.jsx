import app from 'ampersand-app';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { clearUser, hotRoute, login } from '../state/ducks/auth';
import FormLogin from './form-login';
import LayoutNoauth from './layout-noauth';

class FormLoginController extends Component {
  constructor(props) {
    super(props);

    this.hotRoute = this.hotRoute.bind(this);
    this.submit = this.submit.bind(this);
    this.checkForUser = this.checkForUser.bind(this);
  }

  componentDidMount() {
    this.checkForUser();
  }

  componentWillUpdate() {
    this.checkForUser();
  }

  checkForUser() {
    const { router } = this.context;
    if (this.props.auth.user.email.length) {
      router.push('/dashboard');
    }
  }

  hotRoute() {
    const { router } = this.context;

    // warning - hot routing will grant access to the UI, however submitted
    // data will not be persisted/honored
    return this.props.hotRoute()
    .then(() => {
      process.nextTick(() => router.push('/dashboard'));
    });
  }

  submit(evt) {
    const userCred = this.formLogon.data();

    evt.preventDefault();

    this.props.login(userCred);
  }

  render() {
    const { auth, loading } = this.props;
    const showHotRoute = app.config.get('env') === 'development';

    return (
      <LayoutNoauth>
        <FormLogin
          ref={(c) => { this.formLogon = c; }}
          auth={auth}
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
  auth: PropTypes.object.isRequired,
  clearUser: PropTypes.func.isRequired,
  hotRoute: PropTypes.func.isRequired,
  loading: PropTypes.object.isRequired,
  login: PropTypes.func.isRequired,
};

const mapStateToProps = ({ auth, loading }) => {
  return { auth, loading };
};

export default connect(mapStateToProps, {
  clearUser,
  hotRoute,
  login,
})(FormLoginController);
