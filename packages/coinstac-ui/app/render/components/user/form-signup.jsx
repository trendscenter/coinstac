import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import memoize from 'memoize-one';

const styles = theme => ({
  bottomMargin: {
    marginBottom: 10,
  },
  paper: {
    padding: theme.spacing.unit * 2,
    maxWidth: 300,
    marginBottom: theme.spacing.unit * 2,
  },
  formControl: {
    marginBottom: theme.spacing.unit * 2,
  },
  error: {
    textAlign: 'center',
    color: 'red',
  },
});

class FormSignup extends Component {
  state = {
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  };

  checkPasswordsMatch = memoize(
    (password, confirmPassword) => password === confirmPassword
  );

  handleChange = name => (event) => {
    this.setState({
      [name]: event.target.value,
    });
  };

  handleSubmit = (evt) => {
    evt.preventDefault();

    const { onSubmit } = this.props;

    const {
      name,
      username,
      email,
      password,
    } = this.state;

    onSubmit({
      institution: 'mrn',
      name: name.trim(),
      username: username.trim(),
      email: email.trim(),
      password: password.trim(),
    });
  }


  render() {
    const { auth, classes, error } = this.props;
    const {
      name,
      username,
      email,
      password,
      confirmPassword,
    } = this.state;

    const passwordsMatch = this.checkPasswordsMatch(password, confirmPassword);

    return (
      <Paper className={classes.paper}>
        <form onSubmit={this.handleSubmit}>
          {error && (
            <p className={classNames(classes.bottomMargin, classes.error)}>
              {error}
            </p>
          )}
          {!auth.isApiVersionCompatible && (
            <p className={classNames(classes.bottomMargin, classes.error)}>
              This Coinstac version is not compatible with the API.
            </p>
          )}
          <TextField
            label="Name"
            value={name}
            onChange={this.handleChange('name')}
            fullWidth
            className={classes.formControl}
          />
          <TextField
            label="Username"
            value={username}
            onChange={this.handleChange('username')}
            fullWidth
            className={classes.formControl}
          />
          <TextField
            label="Email"
            value={email}
            onChange={this.handleChange('email')}
            fullWidth
            className={classes.formControl}
          />
          <TextField
            label="Password"
            value={password}
            onChange={this.handleChange('password')}
            type="password"
            fullWidth
            className={classes.formControl}
          />
          <TextField
            label="Confirm Password"
            value={confirmPassword}
            onChange={this.handleChange('confirmPassword')}
            type="password"
            fullWidth
            className={classes.formControl}
            error={!passwordsMatch}
            helperText={passwordsMatch ? 'Type your password again' : 'Passwords do not match'}
          />
          <Button
            variant="contained"
            color="primary"
            type="submit"
            fullWidth
            disabled={
              !name
              || !username
              || !email
              || !password
              || !passwordsMatch
              || !auth.isApiVersionCompatible
            }
          >
            Sign Up
          </Button>
        </form>
      </Paper>
    );
  }
}

FormSignup.displayName = 'FormSignup';

FormSignup.defaultProps = {
  error: null,
};

FormSignup.propTypes = {
  auth: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
  error: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
};

export default withStyles(styles)(FormSignup);
