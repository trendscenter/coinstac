import _ from 'lodash';
import app from 'ampersand-app';
import {
  Button,
  ButtonToolbar,
  ControlLabel,
  FormControl,
  FormGroup,
  HelpBlock,
} from 'react-bootstrap';
import React, { Component, PropTypes } from 'react';

export default class FormAddProject extends Component {
  constructor(props) {
    super(props);

    this.state = {
      name: null,
      errors: {},
    };
  }

  handleNameChange(evt) {
    app.core.project.validate(
      { name: evt.target.value },
      { fields: true },
      (err) => {
        if (err) {
          this.state.errors.name = err.message;
          return this.setState(this.state);
        }
        delete this.state.errors.name;
        return this.setState(this.state);
      }
    );
    this.setState(_.assign(this.state, {
      name: evt.target.value,
    }));
  }

  submit(evt) {
    evt.preventDefault();
    const form = _.clone(this.state);
    delete form.errors;
    this.props.submit(form);
  }

  render() {
    const { errors: { name: nameError }, name } = this.state;
    const nameValidationState = nameError ? 'error' : 'default';
    let helpBlock;

    if (nameError) {
      helpBlock = <HelpBlock>{nameError}</HelpBlock>;
    }

    return (
      <div className="projects-new">
        <h3>New Project</h3>
        <form onSubmit={this.submit.bind(this)} className="clearfix">
          <FormGroup
            controlId="add-project-name"
            validationState={nameValidationState}
          >
            <ControlLabel>Name:</ControlLabel>
            <FormControl
              onChange={this.handleNameChange.bind(this)}
              ref="name"
              type="text"
              value={name}
            />
            {helpBlock}
          </FormGroup>
          <ButtonToolbar className="pull-right">
            <Button
              onClick={this.props.handleClickCancel}
              bsStyle="link"
            >
              <span className="glyphicon glyphicon-remove" aria-hidden="true">&nbsp;</span>
              Cancel
            </Button>
            <Button
              type="submit"
              bsStyle="primary"
              disabled={!!Object.keys(this.state.errors).length}
            >
              <span className="glyphicon glyphicon-ok" aria-hidden="true">&nbsp;</span>
              Add
            </Button>
          </ButtonToolbar>
        </form>
      </div>
    );
  }
}

FormAddProject.propTypes = {
  handleClickCancel: PropTypes.func.isRequired,
  submit: PropTypes.func.isRequired,
};

