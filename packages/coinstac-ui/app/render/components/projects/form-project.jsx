import {
  Alert,
  Button,
  ControlLabel,
  FormControl,
  FormGroup,
  HelpBlock,
// TODO: enable with fileRender
//  Label,
} from 'react-bootstrap';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import ProjectCovariatesMapper from './project-covariates-mapper';
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

  // TODO: enable with better file traversing
  // renderFilesField() {
  //   const {
  //     errors: { files: filesError },
  //     onAddFiles,
  //     onRemoveAllFiles,
  //     onRemoveFile,
  //     project: { files },
  //     showFilesComponent,
  //   } = this.props;
  //   let buttons;
  //   let content;
  //   let heading;
  //   let helpBlock;
  //
  //   if (files.length) {
  //     buttons = (
  //       <div className="pull-right">
  //         <Button
  //           bsSize="small"
  //           bsStyle="danger"
  //           onClick={onRemoveAllFiles}
  //           type="button"
  //         >
  //           <span aria-hidden="true" className="glyphicon glyphicon-minus"></span>
  //           {' '}
  //           Remove All Files
  //         </Button>
  //         {' '}
  //         <Button
  //           bsSize="small"
  //           bsStyle="primary"
  //           onClick={onAddFiles}
  //           type="button"
  //         >
  //           <span aria-hidden="true" className="glyphicon glyphicon-plus"></span>
  //           {' '}
  //           Add Files
  //         </Button>
  //       </div>
  //     );
  //     content = (
  //       <ul className="list-unstyled">
  //         {files.map((file, index) => {
  //           return (
  //             <li key={index}>
  //               <ProjectFile
  //                 filename={file.filename}
  //                 onRemove={() => onRemoveFile(file)}
  //               />
  //             </li>
  //           );
  //         })}
  //       </ul>
  //     );
  //     heading = (
  //       <span>
  //         Files
  //         {' '}
  //         <Label>{files.length}</Label>
  //       </span>
  //     );
  //   } else {
  //     buttons = (
  //       <Button
  //         bsSize="small"
  //         bsStyle="primary"
  //         className="pull-right"
  //         onClick={onAddFiles}
  //         type="button"
  //       >
  //         <span aria-hidden="true" className="glyphicon glyphicon-plus"></span>
  //         {' '}
  //         Add Files
  //       </Button>
  //     );
  //     heading = 'Files';
  //
  //     if (!filesError) {
  //       content = (
  //         <Alert bsStyle="info">Select files for the computation.</Alert>
  //       );
  //     }
  //   }
  //
  //   if (!showFilesComponent) {
  //     return;
  //   }
  //
  //   if (filesError) {
  //     helpBlock = <Alert bsStyle="danger">{filesError}</Alert>;
  //   }
  //
  //   return (
  //     <div className="project-form-section project-form-files">
  //       <div className="project-form-section-header clearfix">
  //         <h2 className="h3 pull-left">{heading}</h2>
  //         {buttons}
  //       </div>
  //       <div className="project-form-section-content">
  //         {helpBlock}
  //         {content}
  //       </div>
  //     </div>
  //   );
  // }

  renderMetaFileField() {
    const {
      consortia,
      errors: {
        metaCovariateMapping: metaCovariateMappingErrors,
        metaFile: metaFileError,
        metaFilePath: metaFilePathError,
      },
      inputs,
      project: {
        consortiumId,
        metaCovariateMapping,
        metaFile,
        metaFilePath,
      },
      onAddMetaFile,
      onMapCovariate,
      onRemoveMetaFile,
    } = this.props;
    const selectedConsortia = consortia.find(({ _id }) => _id === consortiumId);
    let button;
    let contents;
    let errorMessage;
    let covariateMapper;

    if (metaFilePath) {
      contents = (
        <ProjectFile
          filename={metaFilePath}
          onRemove={onRemoveMetaFile}
        />
      );

      if (selectedConsortia && inputs) {
        const covariatesIndex = inputs.findIndex(({ type }) => {
          return type === 'covariates';
        });

        if (covariatesIndex > -1) {
          const covariates =
            selectedConsortia.activeComputationInputs[0][covariatesIndex] || [];

          covariateMapper = (
            <ProjectCovariatesMapper
              covariates={covariates}
              csv={metaFile}
              onMapCovariate={onMapCovariate}
              metaCovariateErrors={metaCovariateMappingErrors}
              metaCovariateMapping={metaCovariateMapping}
            />
          );
        }
      }
    } else {
      button = (
        <Button
          bsSize="small"
          bsStyle="primary"
          className="pull-right"
          onClick={onAddMetaFile}
          type="button"
        >
          <span aria-hidden="true" className="glyphicon glyphicon-plus" />
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

    if (metaFileError || metaFilePathError || metaCovariateMappingErrors) {
      errorMessage = (
        <Alert bsStyle="danger">
          {metaFileError || metaFilePathError || metaCovariateMappingErrors}
        </Alert>
      );
    }

    return (
      <div className="project-form-section project-form-meta">
        <div className="project-form-section-header clearfix">
          <h3 className="h3">Metadata File</h3>
          <p>Upload a CSV with the full file paths to your data files in
          the first column and any covariates in the columns after</p>
          {button}
        </div>
        <div className="project-form-section-content">
          {contents}
          {errorMessage}
          {covariateMapper}
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
          <h1>{isEditing ? 'Edit' : 'New'} Files Collection</h1>
        </div>

        <div className="project-form-section project-form-fields">
          {this.renderNameField()}
          {this.renderConsortiaField()}
        </div>
        {/*
          // TODO: enable with better file traversing
          {this.renderFilesField()}
        */}
        {this.renderMetaFileField()}

        <div className="project-form-section project-form-controls clearfix">
          <div className="pull-right">
            <Button bsStyle="success" disabled={isDisabled} type="submit">
              <span className="glyphicon glyphicon-ok" aria-hidden="true" />
              {' '}
              {isEditing ? 'Update' : 'Save'}
            </Button>
            <Button bsStyle="link" onClick={onReset} type="reset">
              <span className="glyphicon glyphicon-remove" aria-hidden="true" />
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
  consortia: PropTypes.array.isRequired,
  errors: PropTypes.shape({
    consortiumId: PropTypes.string,
    metaCovariateMapping: PropTypes.array,
    metaFile: PropTypes.string,
    metaFilePath: PropTypes.string,
    name: PropTypes.string,
  }),
  inputs: PropTypes.arrayOf(PropTypes.object),
  isEditing: PropTypes.bool.isRequired,
  onAddMetaFile: PropTypes.func.isRequired,
  onConsortiumChange: PropTypes.func.isRequired,
  onMapCovariate: PropTypes.func.isRequired,
  onNameChange: PropTypes.func.isRequired,
  onRemoveMetaFile: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  project: PropTypes.shape({
    consortiumId: PropTypes.string,
    metaCovariateMapping: PropTypes.object.isRequired,
    metaFile: PropTypes.arrayOf(PropTypes.array),
    metaFilePath: PropTypes.string,
    name: PropTypes.string.isRequired,
  }).isRequired,
};

FormProject.defaultProps = {
  errors: null,
  inputs: null,
};
