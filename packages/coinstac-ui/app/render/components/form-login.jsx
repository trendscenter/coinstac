import { Alert, Button, ControlLabel, FormControl, FormGroup } from 'react-bootstrap';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

const styles = {
  bottomMargin: { marginBottom: 10 },
};

class FormLogin extends Component {
  data() {
    return {
      username: this.formUsername.value.trim(),
      password: this.formPassword.value.trim(),
    };
  }
  
  render() {
    const { auth, loading, submit, showHotRoute } = this.props;
    let devButtons;

    if (showHotRoute) {
      devButtons = (
        <Button
          bsStyle="warning"
          type="button"
          disabled={loading.isLoading}
          onClick={this.props.hotRoute}
          block
        >Hot Route</Button>
      );
    }

    return (
      <div>
        <div className="panel panel-default">
          <div className="panel-body">
            <form onSubmit={submit}>
              {auth.user && auth.user.error &&
                <Alert bsStyle="danger" style={styles.bottomMargin}>
                  <strong>Error!</strong> {auth.user.error}
                </Alert>
              }
              <FormGroup controlId="login-username">
                <ControlLabel>Username:</ControlLabel>
                <FormControl
                  inputRef={(c) => { this.formUsername = c; }}
                  type="text"
                />
              </FormGroup>
              <FormGroup controlId="login-password">
                <ControlLabel>Password:</ControlLabel>
                <FormControl
                  inputRef={(c) => { this.formPassword = c; }}
                  type="password"
                />
              </FormGroup>
              <Button
                bsStyle="primary"
                type="submit"
                disabled={loading.isLoading}
                block
              >Log In</Button>
              {devButtons}
            </form>
          </div>
        </div>
        <Button bsStyle="link" block>Forgot Password?</Button>
      </div>
    );
  }
}

FormLogin.propTypes = {
  auth: PropTypes.object.isRequired,
  hotRoute: PropTypes.func,
  loading: PropTypes.object,
  showHotRoute: PropTypes.bool.isRequired,
  submit: PropTypes.func.isRequired,
};

FormLogin.defaultProps = {
  hotRoute: null,
  loading: null,
};

export default FormLogin;
