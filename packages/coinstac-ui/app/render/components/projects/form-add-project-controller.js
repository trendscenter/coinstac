import app from 'ampersand-app';
import React, { PropTypes } from 'react';
import FormAddProject from './form-add-project';
import {
  addFilesToProject,
  removeFilesFromProject,
  setProject,
} from 'app/render/state/ducks/project';
import { addProject } from 'app/render/state/ducks/projects';
import { connect } from 'react-redux';
import merge from 'lodash/merge';

class FormAddProjectController extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      errors: {},
    };

    this.handleAddFilesClick = this.handleAddFilesClick.bind(this);
    this.handleClickCancel = this.handleClickCancel.bind(this);
    this.handleNameChange = this.handleNameChange.bind(this);
    this.handleRemoveFileClick = this.handleRemoveFileClick.bind(this);
    this.submit = this.submit.bind(this);
  }

  componentWillMount() {
    this.props.dispatch(setProject({
      files: [],
      name: '',
    }));
  }

  /**
   * Set component's internal error state.
   *
   * @todo Consider moving this to Redux.
   *
   * @param {Object} [errors={}]
   */
  setErrorState(errors = {}) {
    // `setState` is shallow. Ensure everything is persisted:
    this.setState(merge({}, this.state, errors));
  }

  handleAddFilesClick() {
    const { dispatch } = this.props;

    app.main.services.files.select()
      .then(files => dispatch(addFilesToProject(files)))
      .catch(error => {
        // Electron's dialog doesn't produce errors, so this should never happen
        app.notify(
          'error',
          `An error occurred when adding files: ${error.message}`
        );
      });
  }

  handleClickCancel() {
    const { router } = this.context;

    router.push('/projects');
  }

  handleNameChange(event) {
    const { value } = event.target;

    // TODO: Move to ducks?
    app.core.projects.validate({ name: value }, true)
      .then(() => this.setErrorState({ name: null }))
      .catch(error => this.setErrorState({ name: error }));
  }

  handleRemoveFileClick(file) {
    this.props.dispatch(removeFilesFromProject([file]))
  }

  submit(proj) {
    const { dispatch } = this.props;
    const { router } = this.context;

    dispatch(addProject(proj, err => {
      if (!err) {
        router.push('/projects');
      }
    }));
  }

  render() {
    return (
      <FormAddProject
        errors={this.state.errors}
        files={this.props.files}
        onAddFilesClick={this.handleAddFilesClick}
        onCancel={this.handleClickCancel}
        onNameChange={this.handleNameChange}
        onSubmit={this.submit}
        onRemoveFileClick={this.handleRemoveFileClick}
      />
    );
  }
}

FormAddProjectController.contextTypes = {
  router: PropTypes.object.isRequired,
};

FormAddProjectController.propTypes = {
  dispatch: PropTypes.func.isRequired,
  files: PropTypes.array,
};

function select(state) {
  return {
    files: state.project ? state.project.files : [],
  };
}

export default connect(select)(FormAddProjectController);
