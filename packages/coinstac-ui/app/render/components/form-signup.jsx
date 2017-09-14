import { Alert, Button, ControlLabel, FormControl, FormGroup } from 'react-bootstrap';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import FieldPassword from './field-password';

const styles = {
  bottomMargin: { marginBottom: 10 },
};

class FormSignup extends Component {

  constructor(props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit(evt) {
    evt.preventDefault();
    /** @todo  Remove hard-coded institution. */
    this.props.onSubmit({
      email: this.formEmail.value.trim(),
      institution: 'mrn',
      name: this.formSignupName.value.trim(),
      password: this.formPassword.state.password.trim(),
      username: this.formSignupUsername.value.trim(),
    });
  }

  render() {
    const { auth } = this.props;

    return (
      <div className="panel panel-default">
        <div className="panel-body">
          <form onSubmit={this.handleSubmit}>
            {auth.user && auth.user.error &&
              <Alert bsStyle="danger" style={styles.bottomMargin}>
                <strong>Error!</strong> {auth.user.error}
              </Alert>
            }

            <FormGroup controlId="signup-name">
              <ControlLabel>Name:</ControlLabel>
              <FormControl inputRef={(c) => { this.formSignupName = c; }} type="text" />
            </FormGroup>
            <FormGroup controlId="signup-username">
              <ControlLabel>Username:</ControlLabel>
              <FormControl inputRef={(c) => { this.formSignupUsername = c; }} type="text" />
            </FormGroup>
            <FormGroup controlId="signup-email">
              <ControlLabel>Email:</ControlLabel>
              <FormControl inputRef={(c) => { this.formEmail = c; }} type="email" />
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
  auth: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

const mapStateToProps = ({ auth }) => {
  return { auth };
};

export default connect(mapStateToProps)(FormSignup);
