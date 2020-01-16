import React, { Component } from 'react';
import PropTypes from 'prop-types';
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
  TextField,
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import LayoutNoauth from '../layout-noauth';

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
      value => value === this.state.resettingPassword.newPassword,
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

  handleTabChange = selectedTab => {
    const { sendingEmail, resettingPassword } = this.state;

    if (!sendingEmail.loading && !resettingPassword.loading) {
      this.setState({ selectedTab });
    }
  }

  handleSendEmail = () => {
    this.handleSendingEmailStateChange('loading', true);
  }

  handleResetPassword = () => {
    this.handleResettingPasswordStateChange('loading', true);
  }

  render() {
    const { classes } = this.props;
    const { selectedTab, sendingEmail, resettingPassword } = this.state;

    const commonProps = {
      className: classes.formControl,
      fullWidth: true,
      withRequiredValidator: true,
      required: true,
    }

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
              <Tab label="Send Email" value="sendEmail" />
              <Tab label="Password Reset" value="passwordReset" />
            </Tabs>
          </AppBar>

          {selectedTab === "sendEmail" && (
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

          {selectedTab === "passwordReset" && (
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

export default withStyles(styles)(FormPasswordController);
