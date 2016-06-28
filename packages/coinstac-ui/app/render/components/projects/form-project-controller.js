import app from 'ampersand-app';
import clone from 'lodash/clone';
import { connect } from 'react-redux';
import React, { Component, PropTypes } from 'react';
import noop from 'lodash/noop';

import { runComputation } from '../../state/ducks/bg-services';
import { addProject } from '../../state/ducks/projects';
import FormProject from './form-project';

class FormProjectController extends Component {
  constructor(props) {
    super(props);

    this.state = {
      errors: {
        consortiumId: null,
        name: null,
        files: null,
      },
      project: {
        consortiumId: undefined,
        files: [],
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
    this.handleConsortiumChange = this.handleConsortiumChange.bind(this);
    this.handleNameChange = this.handleNameChange.bind(this);
    this.handleRemoveFile = this.handleRemoveFile.bind(this);
    this.handleReset = this.handleReset.bind(this);
    this.handleRunComputation = this.handleRunComputation.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  // componentWillMount() {
  //   this.maybeShowFilesComponent(this.state.project.consortiumId);
  // }

  /**
   * Set state.
   *
   * @todo Find a more elegant way to do this.
   *
   * @param {Object} newState
   */
  setState(newState = {}) {
    super.setState({
      errors: Object.assign({}, this.state.errors, newState.errors),
      project: Object.assign({}, this.state.project, newState.project),
      showFilesComponent: typeof newState.showFilesComponent !== 'undefined' ?
        newState.showFilesComponent :
        this.state.showFilesComponent,
    });
  }

  handleAddFiles() {
    app.main.services.files.select()
      .then(files => {
        this.setState({
          project: {
            files: [...this.state.project.files, ...JSON.parse(files)],
          },
        });
      })
      .catch(error => {
        // Electron's dialog doesn't produce errors, so this should never happen
        app.notify(
          'error',
          `An error occurred when adding files: ${error.message}`
        );
      });
  }

  handleConsortiumChange(event) {
    const { value: consortiumId } = event.target;

    this.setState({
      project: { consortiumId },
    });
    // this.maybeShowFilesComponent(consortiumId);
  }

  handleNameChange(event) {
    const { value: name } = event.target;

    this.setState({
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

  handleRemoveFile(file) {
    this.setState({
      project: {
        files: this.state.project.files.filter(f => {
          return f.filename !== file.filename;
        }),
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

    // Ensure no errors before submitting
    if (!Object.values(errors).some(e => !!e)) {
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
    const { consortia, params } = this.props;
    const { errors, project, showFilesComponent } = this.state;

    const allowComputationRun = !!params.projectId;
    const isEditing = !!params.projectId;

    return (
      <FormProject
        allowComputationRun={allowComputationRun}
        consortia={consortia}
        errors={errors}
        isEditing={isEditing}
        onAddFiles={this.handleAddFiles}
        onConsortiumChange={this.handleConsortiumChange}
        onNameChange={this.handleNameChange}
        onRemoveFile={this.handleRemoveFile}
        onReset={this.handleReset}
        onRunComputation={this.handleRunComputation}
        onSubmit={this.handleSubmit}
        project={project}
        showFilesComponent={showFilesComponent}
      />
    );
  }
}

FormProjectController.contextTypes = {
  router: PropTypes.object.isRequired,
};

FormProjectController.propTypes = {
  consortia: PropTypes.array.isRequired,
  dispatch: PropTypes.func.isRequired,
  params: PropTypes.object.isRequired,
  project: PropTypes.object,
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

  return { consortia, project };
}

export default connect(select)(FormProjectController);
