import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  ValidatorForm,
  TextValidator,
} from 'react-material-ui-form-validator';
import AppBar from '@material-ui/core/AppBar';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import { withStyles } from '@material-ui/core/styles';
import LayoutNoauth from '../layout-noauth';
import {
  sendForgotUsernameEmail,
  sendPasswordResetEmail,
  resetPassword,
} from '../../state/ducks/auth';

const styles = theme => ({
  paper: {
    maxWidth: 640,
  },
  tabPanel: {
    padding: theme.spacing(2),
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  },
});

class FormPasswordController extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedTab: 'forgotPassword',
      forgotPassword: {
        loading: false,
        email: '',
      },
      resettingPassword: {
        loading: false,
        token: '',
        newPassword: '',
        confirmPassword: '',
      },
      forgotUsername: {
        loading: false,
        email: '',
      },
    };
  }

  componentDidMount() {
    ValidatorForm.addValidationRule(
      'isPasswordMatch',
      // eslint-disable-next-line react/destructuring-assignment
      value => value === this.state.resettingPassword.newPassword
    );
  }

  componentWillUnmount() {
    ValidatorForm.removeValidationRule('isPasswordMatch');
  }

  handleForgotPasswordStateChange = (key, value) => {
    const { forgotPassword } = this.state;

    this.setState({
      forgotPassword: {
        ...forgotPassword,
        [key]: value,
      },
    });
  }

  handleResettingPasswordStateChange = (key, value) => {
    const { resettingPassword } = this.state;

    this.setState({
      resettingPassword: {
        ...resettingPassword,
        [key]: value,
      },
    });
  }

  handleForgotUsernameStateChange = (key, value) => {
    const { forgotUsername } = this.state;

    this.setState({
      forgotUsername: {
        ...forgotUsername,
        [key]: value,
      },
    });
  }

  handleTabChange = (selectedTab) => {
    const { forgotPassword, resettingPassword, forgotUsername } = this.state;

    if (!forgotPassword.loading && !resettingPassword.loading && !forgotUsername.loading) {
      this.setState({ selectedTab });
    }
  }

  handleSendForgotPasswordEmail = () => {
    const { sendPasswordResetEmail } = this.props;
    const { forgotPassword } = this.state;

    this.handleForgotPasswordStateChange('loading', true);

    sendPasswordResetEmail({ email: forgotPassword.email })
      .then(() => {
        this.handleForgotPasswordStateChange('loading', false);
        this.handleTabChange('passwordReset');
      })
      .catch(() => {
        this.handleForgotPasswordStateChange('loading', false);
      });
  }

  handleResetPassword = () => {
    const { router } = this.context;
    const { resetPassword } = this.props;
    const { resettingPassword } = this.state;

    this.handleResettingPasswordStateChange('loading', true);

    resetPassword({
      token: resettingPassword.token,
      password: resettingPassword.newPassword,
    })
      .then(() => router.push('/login'))
      .finally(() => {
        this.handleResettingPasswordStateChange('loading', false);
      });
  }

  handleSendForgotUsernameEmail = () => {
    const { sendForgotUsernameEmail } = this.props;
    const { forgotUsername } = this.state;

    this.handleForgotUsernameStateChange('loading', true);

    sendForgotUsernameEmail({ email: forgotUsername.email })
      .then(() => {
        this.handleForgotUsernameStateChange('loading', false);
      })
      .catch(() => {
        this.handleForgotUsernameStateChange('loading', false);
      });
  }

  render() {
    const { classes } = this.props;
    const {
      selectedTab,
      forgotPassword,
      resettingPassword,
      forgotUsername,
    } = this.state;

    const commonProps = {
      fullWidth: true,
      withRequiredValidator: true,
      required: true,
    };

    return (
      <LayoutNoauth>
        <Paper className={classes.paper}>
          <AppBar position="static" color="default">
            <Tabs
              value={selectedTab}
              onChange={
                (_evt, value) => this.handleTabChange(value)
              }
            >
              <Tab label="Forgot Password" value="forgotPassword" />
              <Tab label="Password Reset" value="passwordReset" />
              <Tab label="Forogt Username" value="forgotUsername" />
            </Tabs>
          </AppBar>

          {selectedTab === 'forgotPassword' && (
            <Paper
              className={classes.tabPanel}
              square
            >
              <ValidatorForm
                className={classes.form}
                instantValidate
                noValidate
                onSubmit={this.handleSendForgotPasswordEmail}
              >
                <TextValidator
                  label="Email"
                  value={forgotPassword.email}
                  disabled={forgotPassword.loading}
                  validators={['required']}
                  errorMessages={['Email is required']}
                  onChange={
                    evt => this.handleForgotPasswordStateChange('email', evt.target.value)
                  }
                  {...commonProps}
                />
                <Button
                  variant="contained"
                  color="secondary"
                  type="submit"
                  fullWidth
                  disabled={forgotPassword.loading}
                >
                  Send
                </Button>
              </ValidatorForm>
            </Paper>
          )}

          {selectedTab === 'passwordReset' && (
            <Paper
              className={classes.tabPanel}
              square
            >
              <ValidatorForm
                className={classes.form}
                instantValidate
                noValidate
                onSubmit={this.handleResetPassword}
              >
                <TextValidator
                  label="Password Reset Token"
                  value={resettingPassword.token}
                  disabled={resettingPassword.loading}
                  validators={['required']}
                  errorMessages={['Password reset token is required']}
                  onChange={
                    evt => this.handleResettingPasswordStateChange('token', evt.target.value)
                  }
                  {...commonProps}
                />
                <TextValidator
                  type="password"
                  label="New Password"
                  value={resettingPassword.newPassword}
                  disabled={resettingPassword.loading}
                  validators={['required']}
                  errorMessages={['New password is required']}
                  onChange={
                    evt => this.handleResettingPasswordStateChange('newPassword', evt.target.value)
                  }
                  {...commonProps}
                />
                <TextValidator
                  type="password"
                  label="Confirm Password"
                  value={resettingPassword.confirmPassword}
                  validators={['isPasswordMatch', 'required']}
                  errorMessages={['Password mismatch', 'Confirm password is required']}
                  disabled={resettingPassword.loading}
                  onChange={
                    evt => this.handleResettingPasswordStateChange('confirmPassword', evt.target.value)
                  }
                  {...commonProps}
                />
                <Button
                  variant="contained"
                  color="secondary"
                  type="submit"
                  fullWidth
                  disabled={resettingPassword.loading}
                >
                  Reset
                </Button>
              </ValidatorForm>
            </Paper>
          )}

          {selectedTab === 'forgotUsername' && (
            <Paper
              className={classes.tabPanel}
              square
            >
              <ValidatorForm
                className={classes.form}
                instantValidate
                noValidate
                onSubmit={this.handleSendForgotUsernameEmail}
              >
                <TextValidator
                  label="Email"
                  value={forgotUsername.email}
                  disabled={forgotUsername.loading}
                  validators={['required']}
                  errorMessages={['Email is required']}
                  onChange={
                    evt => this.handleForgotUsernameStateChange('email', evt.target.value)
                  }
                  {...commonProps}
                />
                <Button
                  variant="contained"
                  color="secondary"
                  type="submit"
                  fullWidth
                  disabled={forgotUsername.loading}
                >
                  Send
                </Button>
              </ValidatorForm>
            </Paper>
          )}
        </Paper>
      </LayoutNoauth>
    );
  }
}

FormPasswordController.contextTypes = {
  router: PropTypes.object.isRequired,
};

FormPasswordController.displayName = 'FormPasswordController';

const mapStateToProps = ({ auth, loading }) => ({
  auth,
  loading,
});

const connectedComponent = connect(mapStateToProps, {
  sendForgotUsernameEmail,
  sendPasswordResetEmail,
  resetPassword,
})(FormPasswordController);

export default withStyles(styles)(connectedComponent);
