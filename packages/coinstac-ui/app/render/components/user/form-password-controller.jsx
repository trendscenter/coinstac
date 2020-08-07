import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  ValidatorForm,
  TextValidator,
} from 'react-material-ui-form-validator';
import {
  AppBar,
  Button,
  Paper,
  Tab,
  Tabs,
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import LayoutNoauth from '../layout-noauth';
import {
  sendPasswordResetEmail,
  resetPassword,
} from '../../state/ducks/auth';

const styles = theme => ({
  formControl: {
    flex: '1 0 auto',
    marginBottom: theme.spacing.unit * 2,
  },
  paper: {
    maxWidth: 320,
  },
  submitButtonWrapper: {
    textAlign: 'right',
  },
  tabPanel: {
    padding: theme.spacing.unit * 2,
  },
});

class FormPasswordController extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedTab: 'sendEmail',
      sendingEmail: {
        loading: false,
        email: '',
      },
      resettingPassword: {
        loading: false,
        token: '',
        newPassword: '',
        confirmPassword: '',
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

  handleSendingEmailStateChange = (key, value) => {
    const { sendingEmail } = this.state;

    this.setState({
      sendingEmail: {
        ...sendingEmail,
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

  handleTabChange = (selectedTab) => {
    const { sendingEmail, resettingPassword } = this.state;

    if (!sendingEmail.loading && !resettingPassword.loading) {
      this.setState({ selectedTab });
    }
  }

  handleSendEmail = () => {
    const { sendPasswordResetEmail } = this.props;
    const { sendingEmail } = this.state;

    this.handleSendingEmailStateChange('loading', true);

    sendPasswordResetEmail({ email: sendingEmail.email })
      .then(() => {
        this.handleSendingEmailStateChange('loading', false);
        this.handleTabChange('passwordReset');
      })
      .catch(() => {
        this.handleSendingEmailStateChange('loading', false);
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

  render() {
    const { classes } = this.props;
    const { selectedTab, sendingEmail, resettingPassword } = this.state;

    const commonProps = {
      className: classes.formControl,
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
              <Tab label="Send Reset Email" value="sendEmail" />
              <Tab label="Password Reset" value="passwordReset" />
            </Tabs>
          </AppBar>

          {selectedTab === 'sendEmail' && (
            <Paper
              className={classes.tabPanel}
              square
            >
              <ValidatorForm
                instantValidate
                noValidate
                onSubmit={this.handleSendEmail}
              >
                <TextValidator
                  label="Email"
                  value={sendingEmail.email}
                  disabled={sendingEmail.loading}
                  validators={['required']}
                  errorMessages={['Email is required']}
                  onChange={
                    evt => this.handleSendingEmailStateChange('email', evt.target.value)
                  }
                  {...commonProps}
                />
                <Button
                  variant="contained"
                  color="secondary"
                  type="submit"
                  fullWidth
                  disabled={sendingEmail.loading}
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
  sendPasswordResetEmail,
  resetPassword,
})(FormPasswordController);

export default withStyles(styles)(connectedComponent);
