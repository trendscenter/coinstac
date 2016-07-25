import {
  Alert,
  Button,
  ControlLabel,
  FormControl,
  FormGroup,
  HelpBlock,
} from 'react-bootstrap';
import React, { Component, PropTypes } from 'react';

import ProjectFile from './project-file';

export default class FormProject extends Component {
  constructor(props) {
    super(props);
    this.onSubmit = this.onSubmit.bind(this);
  }

  onSubmit(event) {
    event.preventDefault();

    this.props.onSubmit();
  }

  maybeRenderComputationRunButton() {
    const {
      allowComputationRun,
      onRunComputation,
      showComputationRunButton,
    } = this.props;

    if (showComputationRunButton) {
      return (
        <Button
          disabled={!allowComputationRun}
          onClick={onRunComputation}
        >
          Run Computation
        </Button>
      );
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
      onRemoveAllFiles,
      onRemoveFile,
      project: { files },
      showFilesComponent,
    } = this.props;
    let buttons;
    let content;
    let helpBlock;

    if (files.length) {
      buttons = (
        <div className="pull-right">
          <Button
            bsSize="small"
            bsStyle="primary"
            onClick={onAddFiles}
            type="button"
          >
            <span aria-hidden="true" className="glyphicon glyphicon-plus"></span>
            {' '}
            Add Files
          </Button>
          {' '}
          <Button
            bsSize="small"
            bsStyle="danger"
            onClick={onRemoveAllFiles}
            type="button"
          >
            <span aria-hidden="true" className="glyphicon glyphicon-minus"></span>
            {' '}
            Remove All Files
          </Button>
        </div>
      );
      content = (
        <ul className="list-unstyled">
          {files.map((file, index) => {
            return (
              <li key={index}>
                <ProjectFile
                  filename={file.filename}
                  onRemove={() => onRemoveFile(file)}
                />
              </li>
            );
          })}
        </ul>
      );
    } else {
      buttons = (
        <Button
          bsSize="small"
          bsStyle="primary"
          className="pull-right"
          onClick={onAddFiles}
          type="button"
        >
          <span aria-hidden="true" className="glyphicon glyphicon-plus"></span>
          {' '}
          Add Files
        </Button>
      );

      if (!filesError) {
        content = (
          <Alert bsStyle="info">Select files for the computation.</Alert>
        );
      }
    }

    if (!showFilesComponent) {
      return;
    }

    if (filesError) {
      helpBlock = <Alert bsStyle="danger">{filesError}</Alert>;
    }

    return (
      <div className="project-form-section project-form-files">
        <div className="project-form-section-header clearfix">
          <h2 className="h3 pull-left">Files</h2>
          {buttons}
        </div>
        <div className="project-form-section-content">
          {helpBlock}
          {content}
        </div>
      </div>
    );
  }

  renderMetaFileField() {
    const {
      errors: {
        metaFile: metaFileError,
      },
      project: {
        metaFile,
      },
      onAddMetaFile,
      onRemoveMetaFile,
    } = this.props;
    let button;
    let contents;
    let errorMessage;

    if (metaFile) {
      contents = <ProjectFile filename={metaFile} onRemove={onRemoveMetaFile} />;
    } else {
      button = (
        <Button
          bsSize="small"
          bsStyle="primary"
          className="pull-right"
          onClick={onAddMetaFile}
          type="button"
        >
          <span aria-hidden="true" className="glyphicon glyphicon-plus"></span>
          {' '}
          Add File
        </Button>
      );

      if (!metaFileError) {
        contents = (
          <Alert bsStyle="info">
            Add a <abbr title="Comma Separated Values">CSV</abbr> file with
            metadata for selected files.
          </Alert>
        );
      }
    }

    if (metaFileError) {
      errorMessage = <Alert bsStyle="danger">{metaFileError}</Alert>;
    }

    return (
      <div className="project-form-section project-form-meta">
        <div className="project-form-section-header clearfix">
          <h2 className="h3 pull-left">Meta File</h2>
          {button}
        </div>
        <div className="project-form-section-content">
          {contents}
          {errorMessage}
        </div>
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
      <form className="project-form clearfix" onSubmit={this.onSubmit}>
        <div className="page-header">
          <h1>{isEditing ? 'Edit' : 'New'} Project</h1>
        </div>

        <div className="project-form-section project-form-fields">
          {this.renderNameField()}
          {this.renderConsortiaField()}
        </div>

        {this.renderFilesField()}
        {this.renderMetaFileField()}

        <div className="project-form-section project-form-controls clearfix">
          <div className="pull-left">
            {this.maybeRenderComputationRunButton()}
          </div>
          <div className="pull-right">
            <Button bsStyle="success" disabled={isDisabled} type="submit">
              <span className="glyphicon glyphicon-ok" aria-hidden="true"></span>
              {' '}
              {isEditing ? 'Update' : 'Save'}
            </Button>
            <Button bsStyle="link" onClick={onReset} type="reset">
              <span className="glyphicon glyphicon-remove" aria-hidden="true"></span>
              {' '}
              Cancel
            </Button>
          </div>
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
  onAddMetaFile: PropTypes.func.isRequired,
  onConsortiumChange: PropTypes.func.isRequired,
  onNameChange: PropTypes.func.isRequired,
  onRemoveAllFiles: PropTypes.func.isRequired,
  onRemoveFile: PropTypes.func.isRequired,
  onRemoveMetaFile: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  onRunComputation: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  project: PropTypes.shape({
    files: PropTypes.arrayOf(
      PropTypes.shape({
        filename: PropTypes.string.isRequired,
      })
    ).isRequired,
    metaFile: PropTypes.string,
  }).isRequired,
  showComputationRunButton: PropTypes.bool.isRequired,
  showFilesComponent: PropTypes.bool.isRequired,
};
