import { connect } from 'react-redux';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import FormSignup from './form-signup';
import LayoutNoauth from '../layout-noauth';
import {
  clearError,
  clearUser,
  signUp,
  checkApiVersion,
} from '../../state/ducks/auth';
import { notifySuccess } from '../../state/ducks/notifyAndLog';

class FormSignupController extends Component {
  state = {
    error: null,
  }

  componentDidMount() {
    const { checkApiVersion } = this.props;

    checkApiVersion();

    this.props.clearUser();
    this.props.clearError();
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
  onSubmit = formData => {
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
      return this.handleSignupError(error);
    }

    this.setState({ error: null })

    return this.props.signUp(formData)
      .then(() => {
        const { auth } = this.props;
        if (!auth.error) {
          this.props.notifySuccess({
            message: 'Account created',
          });
        } else {
          this.handleSignupError(auth.error);
        }
      })
      .catch((error) => {
        this.handleSignupError(error)
      });
  }

  checkForUser = () => {
    const { router } = this.context;
    if (this.props.auth.user.email.length) {
      router.push('/dashboard');
    }
  }

  handleSignupError = error => {
    let message;

    if (error.message) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    } else {
      message = 'Signup error occurred. Please try again.';
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
  clearError: PropTypes.func.isRequired,
  clearUser: PropTypes.func.isRequired,
  notifySuccess: PropTypes.func.isRequired,
  signUp: PropTypes.func.isRequired,
  checkApiVersion: PropTypes.func.isRequired,
};

const mapStateToProps = ({ auth }) => {
  return { auth };
};

export default connect(mapStateToProps, {
  clearError,
  clearUser,
  notifySuccess,
  signUp,
  checkApiVersion,
})(FormSignupController);
