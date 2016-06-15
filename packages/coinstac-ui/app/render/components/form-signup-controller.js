import app from 'ampersand-app';
import { connect } from 'react-redux';
import React, { Component, PropTypes } from 'react';
import FormSignup from './form-signup';
import LayoutNoauth from './layout-noauth';
import { signUp } from 'app/render/state/ducks/auth';
import noop from 'lodash/noop';

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
    const { dispatch } = this.props;
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
    if (error) { return FormSignupController.handleSignupError(error); }
    dispatch(signUp(formData, (err) => {
      if (!err) {
        router.push('/login');
      }
    }));
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

  app.notifications.push({
    level: 'error',
    message,
  });
};

FormSignupController.contextTypes = {
  router: PropTypes.object.isRequired,
};

FormSignupController.displayName = 'FormSignupController';

FormSignupController.propTypes = {
  dispatch: PropTypes.func.isRequired,
};

export default connect()(FormSignupController);
