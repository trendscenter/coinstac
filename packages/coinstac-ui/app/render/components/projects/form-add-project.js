import {
  Button,
  ButtonToolbar,
  ControlLabel,
  FormControl,
  FormGroup,
  HelpBlock,
} from 'react-bootstrap';
import { findDOMNode } from 'react-dom';
import React, { Component, PropTypes } from 'react';

export default class FormAddProject extends Component {
  onSubmit(event) {
    event.preventDefault();

    this.props.onSubmit({
      name: findDOMNode('name').value,
    });
  }

  render() {
    const {
      errors,
      errors: { name: nameError },
      onCancel,
      onNameChange,
    } = this.props;
    const validationState = {
      validationState: nameError ? 'error' : undefined,
    };
    let helpBlock;

    if (nameError) {
      helpBlock = <HelpBlock>{nameError}</HelpBlock>;
    }

    return (
      <div className="projects-new">
        <h3>New Project</h3>
        <form onSubmit={this.onSubmit.bind(this)} className="clearfix">
          <FormGroup
            controlId="add-project-name"
            {...validationState}
          >
            <ControlLabel>Name:</ControlLabel>
            <FormControl
              onChange={onNameChange}
              ref="name"
              type="text"
            />
            {helpBlock}
          </FormGroup>
          <ButtonToolbar className="pull-right">
            <Button
              bsStyle="link"
              onClick={onCancel}
              type="reset"
            >
              <span className="glyphicon glyphicon-remove" aria-hidden="true"></span>
              Cancel
            </Button>
            <Button
              type="submit"
              bsStyle="primary"
              disabled={!!Object.keys(errors).length}
            >
              <span className="glyphicon glyphicon-ok" aria-hidden="true"></span>
              Add
            </Button>
          </ButtonToolbar>
        </form>
      </div>
    );
  }
}

FormAddProject.propTypes = {
  errors: PropTypes.object.isRequired,
  onCancel: PropTypes.func.isRequired,
  onNameChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};
