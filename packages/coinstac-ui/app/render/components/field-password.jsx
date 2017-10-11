import {
  ControlLabel,
  FormControl,
  FormGroup,
  HelpBlock,
} from 'react-bootstrap';
import { findDOMNode } from 'react-dom';
import React, { Component } from 'react';

export default class FieldPassword extends Component {
  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
    this.state = {
      hasFeedback: false,
      help: null,
      validationClass: null,
    };
  }

  handleChange() {
    const password = this.formPassword.value;
    const confirmPassword = this.formConfirm.value;
    const state = {};

    if (password && password === confirmPassword) {
      state.help = '';
      state.validationClass = 'success';
      state.password = password;
    } else {
      state.help = 'Passwords do not match';
      state.validationClass = 'error';
      state.password = null;
    }

    this.setState(state);
  }

  password() {
    return this.state.password;
  }

  render() {
    const { help, validationClass } = this.state;
    let helpBlock;
    let validationProps;

    if (help) {
      helpBlock = <HelpBlock>{help}</HelpBlock>;
    }

    if (validationClass) {
      validationProps = {
        validationState: validationClass,
      };
    }

    return (
      <div>
        <FormGroup
          controlId="signup-password"
          {...validationProps}
        >
          <ControlLabel>Password:</ControlLabel>
          <FormControl
            onChange={this.handleChange}
            inputRef={(c) => { this.formPassword = c; }}
            type="password"
          />
        </FormGroup>
        <FormGroup
          controlId="signup-password-confirm"
          {...validationProps}
        >
          <ControlLabel>Confirm Password:</ControlLabel>
          <FormControl
            onChange={this.handleChange}
            inputRef={(c) => { this.formConfirm = c; }}
            type="password"
          />
          {helpBlock}
        </FormGroup>
      </div>
    );
  }
}
