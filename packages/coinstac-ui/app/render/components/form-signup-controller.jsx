import app from 'ampersand-app';
import { connect } from 'react-redux';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import FormSignup from './form-signup';
import LayoutNoauth from './layout-noauth';
import { signUp } from '../state/ducks/auth';

class FormSignupController extends Component {

  constructor(props) {
    super(props);
    this.onSubmit = this.onSubmit.bind(this);
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
    const { router } = this.context;
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
        app.notify({
          level: 'success',
          message: 'Account created',
        });
        process.nextTick(() => router.push('/'));
      })
      .catch((error) => {
        app.notify({
          level: 'error',
          message: error.message,
        });
      });
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
  signUp: PropTypes.func,
};

export default connect(null, { signUp })(FormSignupController);
