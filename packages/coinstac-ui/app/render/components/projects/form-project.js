import {
  Button,
  ControlLabel,
  FormControl,
  FormGroup,
  HelpBlock,
} from 'react-bootstrap';
import React, { Component, PropTypes } from 'react';

import ProjectFiles from './project-files';

export default class FormProject extends Component {
  onSubmit(event) {
    event.preventDefault();

    this.props.onSubmit();
  }

  maybeRenderComputationRunButton() {
    const { allowComputationRun, onRunComputation } = this.props;

    if (allowComputationRun) {
      return <Button onClick={onRunComputation}>Run Computation</Button>;
    }
  }

  renderConsortiaField() {
    const {
      consortia,
      errors: { consortiumId: consortiumIdError },
      onConsortiumChange,
      project: { consortiumId },
    } = this.props;

    const validationState = {
      validationState: consortiumIdError ? 'error' : undefined,
    };
    let helpBlock;

    if (consortiumIdError) {
      helpBlock = <HelpBlock>{consortiumIdError}</HelpBlock>;
    }

    return (
      <FormGroup controlId="form-project-consortium-id" {...validationState}>
        <ControlLabel>Consortium:</ControlLabel>
        <FormControl
          componentClass="select"
          onChange={onConsortiumChange}
          placeholder="Select consortium…"
          value={consortiumId || 0}
        >
          <option disabled value="0">Select consortium…</option>
          {consortia.map(({ _id, label }) => {
            return (
              <option key={_id} value={_id}>{label}</option>
            );
          })}
        </FormControl>
        {helpBlock}
      </FormGroup>
    );
  }

  renderFilesField() {
    const {
      errors: { files: filesError },
      onAddFiles,
      onRemoveFile,
      project: { files },
      showFilesComponent,
    } = this.props;
    let helpBlock;

    if (!showFilesComponent) {
      return;
    }

    if (filesError) {
      helpBlock = <HelpBlock>{filesError}</HelpBlock>;
    }

    return (
      <div>
        <div className="clearfix">
          <Button
            className="pull-right"
            onClick={onAddFiles}
            type="button"
          >
            Add Files
          </Button>
        </div>
        <ProjectFiles files={files} onRemoveFileClick={onRemoveFile} />
        {helpBlock}
      </div>
    );
  }

  renderNameField() {
    const {
      errors: { name: nameError },
      onNameChange,
      project: { name },
    } = this.props;

    const validationState = {
      validationState: nameError ? 'error' : undefined,
    };
    let helpBlock;

    if (nameError) {
      helpBlock = <HelpBlock>{nameError}</HelpBlock>;
    }

    return (
      <FormGroup controlId="form-project-name" {...validationState}>
        <ControlLabel>Name:</ControlLabel>
        <FormControl onChange={onNameChange} type="text" value={name} />
        {helpBlock}
      </FormGroup>
    );
  }

  render() {
    const { errors, isEditing, onReset } = this.props;
    const isDisabled = Object.values(errors).some(e => !!e);

    return (
      <form className="clearfix" onSubmit={this.onSubmit.bind(this)}>
        <h3>{isEditing ? 'Edit' : 'New'} Project</h3>

        {this.renderNameField()}
        {this.renderConsortiaField()}
        {this.renderFilesField()}
        {this.maybeRenderComputationRunButton()}

        <div className="text-right">
          <Button bsStyle="link" onClick={onReset} type="reset">
            <span className="glyphicon glyphicon-remove" aria-hidden="true"></span>
            {' '}
            Cancel
          </Button>
          <Button bsStyle="primary" disabled={isDisabled} type="submit">
            <span className="glyphicon glyphicon-ok" aria-hidden="true"></span>
            {' '}
            {isEditing ? 'Update' : 'Save'}
          </Button>
        </div>
      </form>
    );
  }
}

FormProject.propTypes = {
  allowComputationRun: PropTypes.bool.isRequired,
  consortia: PropTypes.array.isRequired,
  errors: PropTypes.object.isRequired,
  isEditing: PropTypes.bool.isRequired,
  onAddFiles: PropTypes.func.isRequired,
  onConsortiumChange: PropTypes.func.isRequired,
  onNameChange: PropTypes.func.isRequired,
  onRemoveFile: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  onRunComputation: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  project: PropTypes.object.isRequired,
  showFilesComponent: PropTypes.bool.isRequired,
};
