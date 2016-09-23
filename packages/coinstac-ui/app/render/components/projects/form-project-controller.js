import app from 'ampersand-app';
import { cloneDeep, map, noop, tail } from 'lodash';
import { connect } from 'react-redux';
import React, { Component, PropTypes } from 'react';

import { runComputation } from '../../state/ducks/bg-services';
import { addProject } from '../../state/ducks/projects';
import FormProject from './form-project';

class FormProjectController extends Component {
  constructor(props) {
    super(props);

    this.state = {
      allowComputationRun: false,
      errors: {
        consortiumId: null,
        files: null,
        metaCovariateMapping: null,
        metaFile: null,
        metaFilePath: null,
        name: null,
      },
      project: {
        consortiumId: undefined,
        files: [],
        metaCovariateMapping: [],
        metaFile: null,
        metaFilePath: null,
        name: '',
      },

      // TODO: Drop state item
      showFilesComponent: true,
    };

    /**
     * If `props.project` is set then the user is editing the project. Copy it
     * onto the controller's state for editing.
     */
    if (props.project) {
      this.state.project.consortiumId = props.project.consortiumId;
      this.state.project.files = cloneDeep(props.project.files);
      this.state.project.metaCovariateMapping =
        cloneDeep(props.project.metaCovariateMapping);
      this.state.project.metaFile = props.project.metaFile;
      this.state.project.metaFilePath = props.project.metaFilePath;
      this.state.project.name = props.project.name;
    }

    this.handleAddFiles = this.handleAddFiles.bind(this);
    this.handleAddMetaFile = this.handleAddMetaFile.bind(this);
    this.handleConsortiumChange = this.handleConsortiumChange.bind(this);
    this.handleMapCovariate = this.handleMapCovariate.bind(this);
    this.handleNameChange = this.handleNameChange.bind(this);
    this.handleRemoveAllFiles = this.handleRemoveAllFiles.bind(this);
    this.handleRemoveMetaFile = this.handleRemoveMetaFile.bind(this);
    this.handleRemoveFile = this.handleRemoveFile.bind(this);
    this.handleReset = this.handleReset.bind(this);
    this.handleRunComputation = this.handleRunComputation.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  /**
   * Set state.
   *
   * @todo Find a more elegant way to do this.
   *
   * @param {Object} newState
   */
  setState(newState = {}) {
    super.setState({
      allowComputationRun: 'allowComputationRun' in newState ?
        newState.allowComputationRun :
        this.state.allowComputationRun,
      errors: 'errors' in newState ?
        Object.assign({}, this.state.errors, newState.errors) :
        this.state.errors,
      project: 'project' in newState ?
        Object.assign({}, this.state.project, newState.project) :
        this.state.project,
      showFilesComponent: 'showFilesComponent' in newState ?
        newState.showFilesComponent :
        this.state.showFilesComponent,
    });
  }

  /**
   * Get errors from the project state.
   *
   * @param {Object} project
   * @returns {Object}
   */
  getErrors(project) {
    const {
      consortia,
    } = this.props;
    const consortiumId = (this.state.project || {}).consortiumId;
    let selectedConsortium;

    if (consortiumId) {
      selectedConsortium = consortia.find(({ _id }) => _id === consortiumId);
    }

    return Object.keys(project).reduce((memo, key) => {
      const value = project[key];

      if (
        key === 'metaCovariateMapping' &&
        selectedConsortium &&
        Array.isArray(selectedConsortium.activeComputationInputs[0][2]) &&
        selectedConsortium.activeComputationInputs[0][2].length
      ) {
        const newVal = tail(value);

        memo[key] = selectedConsortium.activeComputationInputs[0][2]
          .map((input, covariateIndex) => {
            return !newVal[covariateIndex] ? 'error' : undefined;
          });

        if (!memo[key].some(x => !!x)) {
          memo[key] = null;
        }
      } else if ((key === 'files' && !value.length) || !value) {
        memo[key] = FormProjectController.ERRORS.get(key);
      } else {
        memo[key] = null;
      }

      return memo;
    }, {});
  }

  handleAddFiles() {
    app.main.services.files.select()
      .then(files => {
        this.setState({
          errors: {
            files: null,
          },
          project: {
            files: [...this.state.project.files, ...JSON.parse(files)],
          },
        });
      })
      .catch(error => {
        // Electron's dialog doesn't produce errors, so this should never happen
        app.logger.error(error);
        app.notify(
          'error',
          `An error occurred when adding files: ${error.message}`
        );
      });
  }

  handleAddMetaFile() {
    app.main.services.files.getMetaFile()
      .then(metaFilePath => Promise.all([
        metaFilePath,
        app.core.projects.getCSV(metaFilePath),
      ]))
      .then(([metaFilePath, metaFile]) => {
        this.setState({
          errors: {
            metaFile: null,
          },
          project: {
            metaFile: JSON.parse(metaFile),
            metaFilePath,
          },
        });
      })
      .catch(error => {
        app.logger.error(error);
        this.setState({
          errors: {
            metaFile: error.message,
          },
        });
      });
  }

  handleConsortiumChange(event) {
    const { value: consortiumId } = event.target;

    this.setState({
      errors: this.getErrors({ consortiumId }),
      project: { consortiumId },
    });
  }

  /**
   * Handle project metadata to covariate mapping changes.
   *
   * @todo Refactor into a `Project` model method? Clean it up.
   *
   * @param {number} covariateIndex Consortium's corresponding 'covariate'
   * computation input's element's index
   * @param {number} columnIndex Index of metadata CSV's column
   */
  handleMapCovariate(covariateIndex, columnIndex) {
    const {
      project: {
        metaCovariateMapping: mapping,
      },
    } = this.state;

    mapping[covariateIndex] = columnIndex;

    const metaCovariateMapping = map(mapping, (value, index) => {
      return index === covariateIndex || value !== columnIndex ?
        value :
        undefined;
    });

    this.setState({
      errors: {
        metaCovariateMapping: null,
      },
      project: {
        metaCovariateMapping,
      },
    });
  }

  handleNameChange(event) {
    const { value: name } = event.target;

    this.setState({
      errors: this.getErrors({ name }),
      project: { name },
    });

    app.core.projects.validate({ name }, true)
      .then(() => {
        this.setState({
          error: {
            name: null,
          },
        });
      })
      .catch(error => {
        this.setState({
          error: {
            name: error.message,
          },
        });
      });
  }

  handleRemoveAllFiles() {
    this.setState({
      project: {
        files: [],
      },
    });
  }

  handleRemoveFile(file) {
    this.setState({
      project: {
        files: this.state.project.files.filter(f => {
          return f.filename !== file.filename;
        }),
      },
    });
  }

  handleRemoveMetaFile() {
    this.setState({
      project: {
        metaFilePath: null,
      },
    });
  }

  handleReset() {
    this.context.router.push('/projects');
  }

  handleRunComputation() {
    const { dispatch, params: { projectId } } = this.props;
    const { project: { consortiumId } } = this.state;

    dispatch(runComputation({ consortiumId, projectId }))
      .catch((err) => {
        app.notify('error', err.message);
      });
  }

  handleSubmit() {
    const { dispatch, params: { projectId } } = this.props;
    const { router } = this.context;
    const { errors, project } = this.state;
    const toAdd = projectId ?
      Object.assign({}, this.props.project, project) :
      project;

    const newErrors = this.getErrors(project);

    if (Object.values(newErrors).some(e => !!e)) {
      this.setState({ errors: newErrors });
    } else if (!Object.values(errors).some(e => !!e)) {
      // Ensure no errors before submitting
      dispatch(addProject(toAdd))
        .then(() => {
          router.push('/projects');
        })
        .catch((err) => {
          app.notify('error', err.message);
        });
    } else {
      app.notify('info', 'Fix form errors before submitting');
    }
  }

  /**
   * @todo This is currently unused. Refactor this method to rely on the
   * computation definition.
   */
  maybeShowFilesComponent(consortiumId) {
    const { consortia } = this.props;

    if (consortiumId) {
      const consortium = consortia.find(c => c._id === consortiumId);

      /**
       * Show files component if needed.
       *
       * @todo This is for the demo. Determine a better method for UI based on
       * the computation definition.
       */
      if (consortium && consortium.activeComputationId) {
        app.core.dbRegistry.get('computations')
          .get(consortium.activeComputationId)
          .then(computation => {
            this.setState({
              showFilesComponent:
                computation.name.indexOf('ridge-regression') > -1,
            });
          }, noop);
      }
    }
  }

  render() {
    const { consortia, params, username } = this.props;
    const {
      allowComputationRun,
      errors,
      metaFile,
      metaFilePath,
      project,
      showFilesComponent,
    } = this.state;

    const isEditing = !!params.projectId;
    let showComputationRunButton = false;

    if (project.consortiumId) {
      const selected = consortia.find(c => c._id === project.consortiumId);

      if (selected && selected.owners.indexOf(username) > -1) {
        showComputationRunButton = true;
      }
    }

    return (
      <FormProject
        allowComputationRun={allowComputationRun}
        consortia={consortia}
        errors={errors}
        isEditing={isEditing}
        metaFile={metaFile}
        metaFilePath={metaFilePath}
        onAddFiles={this.handleAddFiles}
        onAddMetaFile={this.handleAddMetaFile}
        onConsortiumChange={this.handleConsortiumChange}
        onMapCovariate={this.handleMapCovariate}
        onNameChange={this.handleNameChange}
        onRemoveAllFiles={this.handleRemoveAllFiles}
        onRemoveFile={this.handleRemoveFile}
        onRemoveMetaFile={this.handleRemoveMetaFile}
        onReset={this.handleReset}
        onRunComputation={this.handleRunComputation}
        onSubmit={this.handleSubmit}
        project={project}
        showComputationRunButton={showComputationRunButton}
        showFilesComponent={showFilesComponent}
      />
    );
  }
}

FormProjectController.contextTypes = {
  router: PropTypes.object.isRequired,
};

/**
 * Field to error message map.
 *
 * @const {Map}
 */
FormProjectController.ERRORS = new Map([
  ['consortiumId', 'Select a consortium'],
  ['files', 'Add some files'],
  ['metaFile', 'Trouble mapping covariates'],
  ['metaFilePath', 'Add a meta file'],
  ['name', 'Add a name'],
]);

FormProjectController.propTypes = {
  consortia: PropTypes.array.isRequired,
  dispatch: PropTypes.func.isRequired,
  params: PropTypes.object.isRequired,
  project: PropTypes.object,
  username: PropTypes.string.isRequired,
};

/**
 * Pluck project and put it on the component's props when editing.
 * {@link https://github.com/reactjs/react-redux/blob/master/docs/api.md}
 */
function select(state, { params: { projectId } }) {
  const project = projectId ?
    state.projects.find(p => p._id === projectId) :
    undefined;
  const username = state.auth.user.username;
  const consortia = state.consortia.filter(c => c.users.indexOf(username) > -1);

  return { consortia, project, username };
}

export default connect(select)(FormProjectController);
