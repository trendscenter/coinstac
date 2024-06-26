import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import {
  checkApiVersion,
  clearError,
  clearUser,
  signUp,
} from '../../state/ducks/auth';
import { notifySuccess } from '../../state/ducks/notifyAndLog';
import LayoutNoauth from '../layout-noauth';
import FormSignup from './form-signup';

class FormSignupController extends Component {
  state = {
    error: null,
  }

  componentDidMount() {
    const { checkApiVersion, clearUser, clearError } = this.props;

    checkApiVersion();
    clearUser();
    clearError();
  }

  componentDidUpdate() {
    this.checkForUser();
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
  onSubmit = (formData) => {
    const { signUp, notifySuccess } = this.props;

    this.setState({ error: null });

    return signUp(formData)
      .then(() => {
        const { auth } = this.props;
        if (!auth.error) {
          notifySuccess('Account created');
        } else {
          this.handleSignupError(auth.error);
        }
      })
      .catch((error) => {
        this.handleSignupError(error);
      });
  }

  checkForUser = () => {
    const { router } = this.context;
    const { auth } = this.props;

    if (auth.user.email.length) {
      router.push('/dashboard');
    }
  }

  handleSignupError = (error) => {
    let { message } = error;

    if (!message) {
      if (typeof error === 'string') {
        message = error;
      } else {
        message = 'Signup error occurred. Please try again.';
      }
    }

    this.setState({ error: message });
  }

  render() {
    const { auth } = this.props;
    const { error } = this.state;

    return (
      <LayoutNoauth>
        <FormSignup
          auth={auth}
          error={error}
          onSubmit={this.onSubmit}
        />
      </LayoutNoauth>
    );
  }
}

FormSignupController.contextTypes = {
  router: PropTypes.object.isRequired,
};

FormSignupController.displayName = 'FormSignupController';

FormSignupController.propTypes = {
  auth: PropTypes.object.isRequired,
  checkApiVersion: PropTypes.func.isRequired,
  clearError: PropTypes.func.isRequired,
  clearUser: PropTypes.func.isRequired,
  notifySuccess: PropTypes.func.isRequired,
  signUp: PropTypes.func.isRequired,
};

const mapStateToProps = ({ auth }) => ({
  auth,
});

export default connect(mapStateToProps, {
  clearError,
  clearUser,
  notifySuccess,
  signUp,
  checkApiVersion,
})(FormSignupController);
