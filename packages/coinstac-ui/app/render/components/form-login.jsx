import { Button, ControlLabel, FormControl, FormGroup } from 'react-bootstrap';
import { findDOMNode } from 'react-dom';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

class FormLogin extends Component {
  data() {
    return {
      username: findDOMNode(this.formUsername).value,
      password: findDOMNode(this.formPassword).value,
    };
  }
  render() {
    const { loading, submit, showHotRoute } = this.props;
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
              <FormGroup controlId="login-username">
                <ControlLabel>Username:</ControlLabel>
                <FormControl
                  ref={(c) => { this.formUsername = c; }}
                  type="text"
                />
              </FormGroup>
              <FormGroup controlId="login-password">
                <ControlLabel>Password:</ControlLabel>
                <FormControl
                  ref={(c) => { this.formPassword = c; }}
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
