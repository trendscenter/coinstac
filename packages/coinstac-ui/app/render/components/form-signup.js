import { Button, ControlLabel, FormControl, FormGroup } from 'react-bootstrap';
import { findDOMNode } from 'react-dom';
import React, { Component, PropTypes } from 'react';
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
      email: findDOMNode(this.refs.email).value,
      institution: 'mrn',
      name: findDOMNode(this.refs['signup-name']).value,
      password: this.refs.password.state.password,
      username: findDOMNode(this.refs['signup-username']).value,
    });
  }

  render() {
    return (
      <div className="panel panel-default">
        <div className="panel-body">
          <form onSubmit={this.handleSubmit}>
            <FormGroup controlId="signup-name">
              <ControlLabel>Name:</ControlLabel>
              <FormControl ref="signup-name" type="text" />
            </FormGroup>
            <FormGroup controlId="signup-username">
              <ControlLabel>Username:</ControlLabel>
              <FormControl ref="signup-username" type="text" />
            </FormGroup>
            <FormGroup controlId="signup-email">
              <ControlLabel>Email:</ControlLabel>
              <FormControl ref="email" type="email" />
            </FormGroup>
            <FieldPassword ref="password" />
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
