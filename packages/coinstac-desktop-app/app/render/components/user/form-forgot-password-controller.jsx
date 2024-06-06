import AppBar from '@material-ui/core/AppBar';
import Paper from '@material-ui/core/Paper';
import { withStyles } from '@material-ui/core/styles';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import {
  resetForgotPassword,
  sendPasswordResetEmail,
} from '../../state/ducks/auth';
import LayoutNoauth from '../layout-noauth';
import FormForgotPassword from './form-forgot-password';
import FormSendEmail from './form-send-email';

const styles = theme => ({
  paper: {
    maxWidth: 367,
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

class FormForgotPasswordController extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedTab: 'sendEmail',
      sendingEmail: false,
      resettingPassword: false,
    };
  }

  handleTabChange = (selectedTab) => {
    const { sendingEmail, resettingPassword } = this.state;

    if (!sendingEmail && !resettingPassword) {
      this.setState({ selectedTab });
    }
  }

  handleSendEmail = (values) => {
    const { sendPasswordResetEmail } = this.props;

    this.setState({ sendingEmail: true });

    sendPasswordResetEmail(values)
      .then(() => {
        this.setState({ sendingEmail: false });
        this.handleTabChange('resetForgotPassword');
      })
      .catch(() => {
        this.setState({ sendingEmail: false });
      });
  }

  handleResetForgotPassword = (values) => {
    const { router } = this.context;
    const { resetForgotPassword } = this.props;

    this.setState({ resettingPassword: true });

    resetForgotPassword(values)
      .then(() => router.push('/login'))
      .finally(() => {
        this.setState({ resettingPassword: false });
      });
  }

  render() {
    const { classes } = this.props;
    const { selectedTab, sendingEmail, resettingPassword } = this.state;

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
              <Tab label="Reset Forgot Password" value="resetForgotPassword" />
            </Tabs>
          </AppBar>

          {selectedTab === 'sendEmail' && (
            <Paper
              className={classes.tabPanel}
              square
            >
              <FormSendEmail
                loading={sendingEmail}
                onSubmit={this.handleSendEmail}
              />
            </Paper>
          )}

          {selectedTab === 'resetForgotPassword' && (
            <Paper
              className={classes.tabPanel}
              square
            >
              <FormForgotPassword
                loading={resettingPassword}
                onSubmit={this.handleResetForgotPassword}
              />
            </Paper>
          )}
        </Paper>
      </LayoutNoauth>
    );
  }
}

FormForgotPasswordController.contextTypes = {
  router: PropTypes.object.isRequired,
};

FormForgotPasswordController.propTypes = {
  classes: PropTypes.object.isRequired,
  sendPasswordResetEmail: PropTypes.func.isRequired,
  resetForgotPassword: PropTypes.func.isRequired,
};

FormForgotPasswordController.displayName = 'FormForgotPasswordController';

const mapStateToProps = ({ auth, loading }) => ({
  auth,
  loading,
});

const connectedComponent = connect(mapStateToProps, {
  sendPasswordResetEmail,
  resetForgotPassword,
})(FormForgotPasswordController);

export default withStyles(styles)(connectedComponent);
