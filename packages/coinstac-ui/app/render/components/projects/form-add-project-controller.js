import app from 'ampersand-app';
import React, { PropTypes } from 'react';
import FormAddProject from './form-add-project';
import { addProject } from 'app/render/state/ducks/projects.js';
import { connect } from 'react-redux';
import merge from 'lodash/merge';

class FormAddProjectController extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      errors: {},
    };

    this.handleClickCancel = this.handleClickCancel.bind(this);
    this.handleNameChange = this.handleNameChange.bind(this);
    this.submit = this.submit.bind(this);
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

  handleClickCancel() {
    const { router } = this.context;

    router.push({ state: 'cancelNewProject' }, '/projects');
  }

  handleNameChange(event) {
    const { value } = event.target;

    app.core.projects.validate({ name: value }, true)
      .then(() => this.setErrorState({ name: null }))
      .catch(error => this.setErrorState({ name: error }));
  }

  submit(proj) {
    const { dispatch } = this.props;
    const { router } = this.context;

    dispatch(addProject(proj, err => {
      if (!err) {
        router.push({ state: 'newProjectAdded' }, '/projects');
      }
    }));
  }

  render() {
    return (
      <FormAddProject
        errors={this.state.errors}
        onNameChange={this.handleNameChange}
        onCancel={this.handleClickCancel}
        onSubmit={this.submit}
      />
    );
  }
}

FormAddProjectController.contextTypes = {
  router: PropTypes.object.isRequired,
};

FormAddProjectController.propTypes = {
  dispatch: PropTypes.func.isRequired,
};

export default connect()(FormAddProjectController);
