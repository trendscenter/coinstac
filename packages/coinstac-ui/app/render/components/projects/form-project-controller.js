import app from 'ampersand-app';
import { cloneDeep, get, noop, pickBy, values } from 'lodash';
import { connect } from 'react-redux';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import deepEqual from 'deep-equal';

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
        computationInputs: null,
        consortiumId: undefined,
        files: [],
        // TODO: Don't tie datastructure to input type
        metaCovariateMapping: {},
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
      this.state.project.metaFile = props.project.metaFile;
      this.state.project.metaFilePath = props.project.metaFilePath;
      this.state.project.name = props.project.name;

      if (props.project.consortiumId) {
        const consortium = props.consortia.find(
          ({ _id }) => _id === props.project.consortiumId
        );

        /**
         * Always load the consortium's `activeComputationInputs` to ensure the
         * project's `metaCovariateMapping` matches.
         *
         * @todo Investigate race conditions where a consortium's inputs change
         * while a user creates a project.
         * @todo remove consortiumId clearing on bad find lookup
         */
        if (consortium) {
          this.state.project.computationInputs =
          cloneDeep(consortium.activeComputationInputs);

          if (deepEqual(
            props.project.computationInputs,
            consortium.activeComputationInputs
          )) {
            this.state.project.metaCovariateMapping =
            cloneDeep(props.project.metaCovariateMapping);
          }
        } else {
          this.state.project.consortiumId = null;
        }
      }
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
    this.maybeGetInputs = this.maybeGetInputs.bind(this);
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
      // TODO: enable with fileRender
      // showFilesComponent: 'showFilesComponent' in newState ?
      //   newState.showFilesComponent :
      //   this.state.showFilesComponent,
    });
  }

  /**
   * Get errors from the project state.
   *
   * @param {Object} project
   * @returns {Object}
   */
  getErrors(project) {
    const { consortia } = this.props;

    return Object.keys(project).reduce((memo, key) => {
      const value = project[key];

      if (key === 'metaCovariateMapping') {
        const consortiumId = get(this.state, 'project.consortiumId');
        const selectedConsortium = consortiumId ?
          consortia.find(({ _id }) => _id === consortiumId) :
          undefined;
        const inputs = this.maybeGetInputs();
        const covariatesIndex = inputs ?
          inputs.findIndex(({ type }) => type === 'covariates') :
          -1;

        if (
          covariatesIndex > -1 &&
          Array.isArray(
            selectedConsortium.activeComputationInputs[0][covariatesIndex]
          ) &&
          selectedConsortium.activeComputationInputs[0][covariatesIndex].length &&
          (
            values(value).length <
            selectedConsortium.activeComputationInputs[0][covariatesIndex].length
          )
        ) {
          memo[key] = 'Missing covariate mapping';
        }
      // TODO: enable with fileRender
      // } else if (key === 'files' && !value.length) || !value) {
      //   memo[key] = FormProjectController.ERRORS.get(key);
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
        app.notify({
          level: 'error',
          message: `An error occurred when adding files: ${error.message}`,
        });
      });
  }

  handleAddMetaFile() {
    app.main.services.files.getMetaFile()
      .then(metaFilePath => Promise.all([
        metaFilePath,
        app.core.projects.getCSV(metaFilePath),
      ]))
      .then(([metaFilePath, rawMetaFile]) => {
        const metaFile = JSON.parse(rawMetaFile);

        this.setState({
          errors: {
            metaFile: null,
            files: null,
          },
          project: {
            files: app.core.projects.getFilesFromMetadata(
              metaFilePath,
              metaFile
            ),
            metaFile,
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
      project: {
        consortiumId,
        computationInputs: cloneDeep(this.props.consortia
          .find(({ _id }) => _id === consortiumId)
          .activeComputationInputs),
        metaCovariateMapping: {},
      },
    });
  }

  /**
   * Handle project metadata to covariate mapping changes.
   *
   * @todo Refactor into a `Project` model method? Clean it up.
   *
   * @param {number} covariateIndex Consortium's corresponding 'covariate'
   * computation input's element's index
   * @param {number} metaFileIndex Index of metadata file's column
   */
  handleMapCovariate(covariateIndex, metaFileIndex) {
    const {
      project: {
        metaCovariateMapping: mapping,
      },
    } = this.state;

    const metaCovariateMapping = pickBy(
      Object.assign({}, mapping, { [metaFileIndex]: covariateIndex }),
      (value, key) => {
        return value !== covariateIndex || parseInt(key, 10) === metaFileIndex;
      }
    );

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
        metaCovariateMapping: {},
        metaFile: null,
        metaFilePath: null,
      },
    });
  }

  handleReset() {
    this.context.router.push('/my-files');
  }

  handleRunComputation() {
    const { dispatch, params: { projectId } } = this.props;
    const { project: { consortiumId } } = this.state;

    dispatch(runComputation({ consortiumId, projectId }))
      .catch((err) => {
        app.notify({
          level: 'error',
          message: err.message,
        });
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
          router.push('/my-files');
        })
        .catch((err) => {
          app.notify({
            level: 'error',
            message: err.message,
          });
        });
    } else {
      app.notify({
        message: 'Fix form errors before submitting',
      });
    }
  }

  /**
   * Maybe get the project's associated computation's inputs.
   *
   * @returns {(Object[]|undefined)} inputs
   */
  maybeGetInputs() {
    const { computations, consortia } = this.props;
    const { project: { consortiumId } } = this.state;

    if (!consortiumId) {
      return;
    }

    const selectedConsortium = consortia.find(({ _id }) => {
      return _id === consortiumId;
    });

    if (!selectedConsortium || !selectedConsortium.activeComputationId) {
      return;
    }

    const activeComputation = computations.find(({ _id }) => {
      return _id === selectedConsortium.activeComputationId;
    });

    if (
      !activeComputation ||
      !Array.isArray(activeComputation.inputs) ||
      !Array.isArray(activeComputation.inputs[0])
    ) {
      return;
    }

    return activeComputation.inputs[0];
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
      // TODO: enable with fileRender
      // showFilesComponent,
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
        inputs={this.maybeGetInputs()}
        isEditing={isEditing}
        metaFile={metaFile}
        metaFilePath={metaFilePath}
        // TODO: enable with fileRender
        // onAddFiles={this.handleAddFiles}
        onAddMetaFile={this.handleAddMetaFile}
        onConsortiumChange={this.handleConsortiumChange}
        onMapCovariate={this.handleMapCovariate}
        onNameChange={this.handleNameChange}
        // TODO: enable with fileRender
        // onRemoveAllFiles={this.handleRemoveAllFiles}
        // onRemoveFile={this.handleRemoveFile}
        onRemoveMetaFile={this.handleRemoveMetaFile}
        onReset={this.handleReset}
        onRunComputation={this.handleRunComputation}
        onSubmit={this.handleSubmit}
        project={project}
        showComputationRunButton={showComputationRunButton}
        // TODO: enable with fileRender
        // showFilesComponent={showFilesComponent}
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
  ['metaFilePath', 'Add a metadata file'],
  ['name', 'Add a name'],
]);

FormProjectController.propTypes = {
  computations: PropTypes.arrayOf(PropTypes.object).isRequired,
  consortia: PropTypes.array.isRequired,
  dispatch: PropTypes.func.isRequired,
  params: PropTypes.object.isRequired,
  project: PropTypes.object,
  username: PropTypes.string.isRequired,
};

/**
 * Pluck project and put it on the component's props when editing.
 * {@link https://github.com/reactjs/react-redux/blob/master/docs/api.md}
 *
 * @param {Object} state
 * @param {Object} state.auth
 * @param {Object[]} state.computations
 * @param {Object[]} state.consortia
 * @param {Object[]} state.projects
 * @param {Object} ownProps
 * @param {Object} ownProps.params
 * @returns {Object}
 */
function mapStateToProps(
  {
    auth,
    computations,
    consortia,
    projects,
  },
  {
    params: { projectId },
  }
) {
  const { user: { username } } = auth;

  return {
    computations,
    consortia: consortia.filter(({ users }) => users.indexOf(username) > -1),
    project: projectId ?
      projects.find(({ _id }) => _id === projectId) :
      undefined,
    username,
  };
}

export default connect(mapStateToProps)(FormProjectController);
