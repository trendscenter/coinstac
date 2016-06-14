import React, { PropTypes } from 'react';
import FormAddProject from './form-add-project';
import { addProject } from 'app/render/state/ducks/projects.js';
import { connect } from 'react-redux';

class FormAddProjectController extends React.Component {

  handleClickCancel() {
    const { router } = this.context;

    router.push({ state: 'cancelNewProject' }, '/projects');
  }

  submit(proj) {
    const { dispatch } = this.props;
    const { router } = this.context;

    dispatch(addProject(proj, (err, rslt) => {
      if (!err) {
        router.push({ state: 'newProjectAdded' }, '/projects');
      }
    }));
  }

  render() {
    return (
      <FormAddProject
        ref="add"
        handleClickCancel={this.handleClickCancel.bind(this)}
        submit={this.submit.bind(this)}
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
