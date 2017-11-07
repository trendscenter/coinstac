import app from 'ampersand-app';
import { connect } from 'react-redux';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import FormSignup from './form-signup';
import LayoutNoauth from './layout-noauth';
import { clearError, clearUser, signUp } from '../state/ducks/auth';

class FormSignupController extends Component {
  constructor(props) {
    super(props);
    this.onSubmit = this.onSubmit.bind(this);
    this.checkForUser = this.checkForUser.bind(this);
  }

  componentDidMount() {
    this.props.clearUser();
  }

  componentDidUpdate() {
    this.checkForUser();
  }

  componentWillUnmount() {
    const { auth, clearError } = this.props;
    if (auth.error) {
      clearError();
    }
  }

  /**
   * Handle new user form submits.
   *
   * @todo  Improve form validation, move Redux action or middleware.
   *
   * @param  {object}    formData
   * @param  {string}    formData.email
   * @param  {string}    formData.institution
   * @param  {string}    formData.name
   * @param  {string}    formData.password
   * @param  {string}    formData.username
   * @return {undefined}
   */
  onSubmit(formData) {
    let error;

    if (!formData.name) {
      error = 'Name required';
    } else if (!formData.username) {
      error = 'Username required';
    } else if (!formData.email) {
      error = 'Email required';
    } else if (!formData.password) {
      error = 'Password required';
    } else if (formData.password.length < 8) {
      error = 'Password must be at least 8 characters long';
    } else if (!formData.institution) {
      error = 'Institution required';
    }

    if (error) {
      return FormSignupController.handleSignupError(error);
    }

    return this.props.signUp(formData)
      .then(() => {
        if (!this.props.auth.error) {
          app.notify({
            level: 'success',
            message: 'Account created',
          });
        }
      })
      .catch((error) => {
        app.notify({
          level: 'error',
          message: error.message,
        });
      });
  }

  checkForUser() {
    const { router } = this.context;
    if (this.props.auth.user.email.length) {
      router.push('/dashboard');
    }
  }

  render() {
    return (
      <LayoutNoauth>
        <FormSignup onSubmit={this.onSubmit} />
      </LayoutNoauth>
    );
  }
}

FormSignupController.handleSignupError = function _(error) {
  let message;

  if (error.message) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  } else {
    message = 'Signup error occurred. Please try again.';
  }

  app.notify({
    level: 'error',
    message,
  });
};

FormSignupController.contextTypes = {
  router: PropTypes.object.isRequired,
};

FormSignupController.displayName = 'FormSignupController';

FormSignupController.propTypes = {
  auth: PropTypes.object.isRequired,
  clearError: PropTypes.func.isRequired,
  clearUser: PropTypes.func.isRequired,
  signUp: PropTypes.func.isRequired,
};

const mapStateToProps = ({ auth }) => {
  return { auth };
};

export default connect(mapStateToProps, { clearError, clearUser, signUp })(FormSignupController);
