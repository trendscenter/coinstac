import app from 'ampersand-app';
import clone from 'lodash/clone';
import { connect } from 'react-redux';
import React, { Component, PropTypes } from 'react';
import noop from 'lodash/noop';

import { runComputation } from '../../state/ducks/bg-services';
import { addProject } from '../../state/ducks/projects';
import FormProject from './form-project';

class FormProjectController extends Component {
  /**
   * Get errors from the project state.
   *
   * @param {Object} project
   * @returns {Object}
   */
  static getErrors(project) {
    return Object.keys(project).reduce((memo, key) => {
      const value = project[key];

      if ((key === 'files' && !value.length) || !value) {
        memo[key] = FormProjectController.ERRORS.get(key);
      } else {
        memo[key] = null;
      }

      return memo;
    }, {});
  }

  constructor(props) {
    super(props);

    this.state = {
      allowComputationRun: false,
      errors: {
        consortiumId: null,
        name: null,
        files: null,
        metaFile: null,
      },
      project: {
        consortiumId: undefined,
        files: [],
        metaFile: null,
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
      this.state.project.files = clone(props.project.files);
      this.state.project.name = props.project.name;
    }

    this.handleAddFiles = this.handleAddFiles.bind(this);
    this.handleAddMetaFile = this.handleAddMetaFile.bind(this);
    this.handleConsortiumChange = this.handleConsortiumChange.bind(this);
    this.handleNameChange = this.handleNameChange.bind(this);
    this.handleRemoveAllFiles = this.handleRemoveAllFiles.bind(this);
    this.handleRemoveMetaFile = this.handleRemoveMetaFile.bind(this);
    this.handleRemoveFile = this.handleRemoveFile.bind(this);
    this.handleReset = this.handleReset.bind(this);
    this.handleRunComputation = this.handleRunComputation.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentWillMount() {
    // this.maybeShowFilesComponent(this.state.project.consortiumId);
    this.maybeAllowComputationRun(this.state.project.consortiumId);
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
      .then(metaFile => {
        this.setState({
          errors: {
            metaFile: null,
          },
          project: {
            metaFile,
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
      errors: FormProjectController.getErrors({ consortiumId }),
      project: { consortiumId },
    });

    // TODO: Figure out why `nextTick` is necessary. React internals?
    process.nextTick(() => this.maybeAllowComputationRun(consortiumId));
    // this.maybeShowFilesComponent(consortiumId);
  }

  handleNameChange(event) {
    const { value: name } = event.target;

    this.setState({
      errors: FormProjectController.getErrors({ name }),
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
        metaFile: null,
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

    const newErrors = FormProjectController.getErrors(project);

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
   * Determine whether the project (or, computation) can be run.
   * @see coinstac-client-core/src/sub-api/computation-service.js
   *
   * @param {string} consortiumId
   */
  maybeAllowComputationRun(consortiumId) {
    const { params: { projectId } } = this.props;

    if (!projectId) {
      this.setState({ allowComputationRun: false });
    } else {
      app.core.computations.canStartComputation(consortiumId)
        .then(() => {
          this.setState({ allowComputationRun: true });
        })
        .catch(() => {
          this.setState({ allowComputationRun: false });
        });
    }
  }

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
        onAddFiles={this.handleAddFiles}
        onAddMetaFile={this.handleAddMetaFile}
        onConsortiumChange={this.handleConsortiumChange}
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
  ['metaFile', 'Add a meta file'],
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
