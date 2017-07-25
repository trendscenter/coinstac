import { Button, ControlLabel, FormControl, FormGroup } from 'react-bootstrap';
import { findDOMNode } from 'react-dom';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import FieldPassword from './field-password';

class FormSignup extends Component {

  constructor(props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit(evt) {
    evt.preventDefault();
    /** @todo  Remove hard-coded institution. */
    this.props.onSubmit({
      email: findDOMNode(this.formEmail).value,
      institution: 'mrn',
      name: findDOMNode(this.formSignupName).value,
      password: this.formPassword.state.password,
      username: findDOMNode(this.formSignupUsername).value,
    });
  }

  render() {
    return (
      <div className="panel panel-default">
        <div className="panel-body">
          <form onSubmit={this.handleSubmit}>
            <FormGroup controlId="signup-name">
              <ControlLabel>Name:</ControlLabel>
              <FormControl ref={(c) => { this.formSignupName = c; }} type="text" />
            </FormGroup>
            <FormGroup controlId="signup-username">
              <ControlLabel>Username:</ControlLabel>
              <FormControl ref={(c) => { this.formSignupUsername = c; }} type="text" />
            </FormGroup>
            <FormGroup controlId="signup-email">
              <ControlLabel>Email:</ControlLabel>
              <FormControl ref={(c) => { this.formEmail = c; }} type="email" />
            </FormGroup>
            <FieldPassword ref={(c) => { this.formPassword = c; }} />
            <Button
              bsStyle="primary"
              type="submit"
              block
            >Sign Up</Button>
          </form>
        </div>
      </div>
    );
  }
}

FormSignup.displayName = 'FormSignup';

FormSignup.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};

export default FormSignup;
