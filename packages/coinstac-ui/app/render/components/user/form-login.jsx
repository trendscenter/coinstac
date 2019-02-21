import { Alert } from 'react-bootstrap';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormStartupDirectory from './form-startup-directory';

const styles = theme => ({
  loginFormContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  paper: {
    padding: theme.spacing.unit * 2,
    maxWidth: 300,
    marginBottom: theme.spacing.unit * 2,
  },
  bottomMargin: {
    marginBottom: 10,
  },
  formControl: {
    marginBottom: theme.spacing.unit * 2,
  },
});

class FormLogin extends Component {
  constructor(props) {
    super(props);

    this.state = {
      username: '',
      password: '',
      saveLogin: false,
      openSetStartupDirectoryDialog: false,
    };
  }

  onSubmit = (e) => {
    e.preventDefault();

    const { username, password, saveLogin } = this.state;

    const data = {
      username: username.trim(),
      password: password.trim(),
      saveLogin,
    };

    this.props.submit(data);
  }

  handleChange = name => event => {
    this.setState({
      [name]: event.target.value,
    });
  };

  handleChangeCheckbox = name => event => {
    this.setState({
      [name]: event.target.checked,
    });
  };

  openStartupDirectoryDialog = () => {
    this.setState({ openSetStartupDirectoryDialog: true });
  }

  closeStartupDirectoryDialog = () => {
    this.setState({ openSetStartupDirectoryDialog: false });
  }

  changeAppDirectory = ({ appDirectory }) => {
    this.props.changeAppDirectory(appDirectory);
    this.setState({ openSetStartupDirectoryDialog: false });
  }

  render() {
    const { auth, loading, classes } = this.props;
    const { username, password, saveLogin, openSetStartupDirectoryDialog } = this.state;

    return (
      <div className={classes.loginFormContainer}>
        <Paper className={classes.paper}>
          <form onSubmit={this.onSubmit}>
            {
              auth.error
              && (
                <Alert bsStyle="danger" className={classes.bottomMargin}>
                  <strong>Error!</strong> {auth.error}
                </Alert>
              )
            }
            <TextField
              id="login-username"
              label="Username"
              value={username}
              onChange={this.handleChange('username')}
              fullWidth
              className={classes.formControl}
            />
            <TextField
              id="login-password"
              label="Password"
              value={password}
              onChange={this.handleChange('password')}
              type="password"
              fullWidth
              className={classes.formControl}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={saveLogin}
                  onChange={this.handleChangeCheckbox('saveLogin')}
                />
              }
              label="Keep me logged in"
              className={classes.formControl}
            />
            <Button
              variant="contained"
              color="primary"
              type="submit"
              fullWidth
              disabled={loading.isLoading}
            >
              Log In
            </Button>
          </form>
        </Paper>
        <Button>Forgot Password?</Button>
        <Button onClick={this.openStartupDirectoryDialog}>Change App Settings</Button>
        <FormStartupDirectory
          open={openSetStartupDirectoryDialog}
          close={this.closeStartupDirectoryDialog}
          onSubmit={this.changeAppDirectory}
          appDirectory={auth.appDirectory}
        />
      </div>
    );
  }
}

FormLogin.propTypes = {
  auth: PropTypes.object.isRequired,
  loading: PropTypes.object,
  submit: PropTypes.func.isRequired,
  classes: PropTypes.object.isRequired,
  changeAppDirectory: PropTypes.func.isRequired,
};

FormLogin.defaultProps = {
  loading: null,
};

export default withStyles(styles)(FormLogin);
