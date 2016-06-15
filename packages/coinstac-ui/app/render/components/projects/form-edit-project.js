import _ from 'lodash';
import app from 'ampersand-app';
import React, { Component, PropTypes } from 'react';
import {
  Alert,
  Button,
  ControlLabel,
  FormControl,
  FormGroup,
  HelpBlock,
} from 'react-bootstrap';
import { reduxForm } from 'redux-form';
import { saveProject, setProject } from 'app/render/state/ducks/project.js';
import FormProjectContext from './form-project-context.js';
import BackButton from 'app/render/components/controls/buttons/back.js';

class FormEditProject extends Component {
  handleNameChange(evt) {
    const patch = { name: evt.target.value };
    this.props.patchProject(patch, (err) => {
      if (err) {
        this.state.errors.name = err.message;
        return this.setState(this.state);
      }
    });
  }

  submit(values, dispatch) {
    const { project } = this.props;
    const newProj = _.cloneDeep(project);
    // map form values to model values
    newProj.name = values.name;
    newProj.defaultAnalysisId = values.analysis;
    newProj.defaultConsortiumId = values.consortium;
    return new Promise((res, rej) => {
      dispatch(saveProject(newProj, (err, proj) => {
        if (err) {
          const errors = _.each(
            _.groupBy(err.details, 'path'),
            (errs, field, obj) => {
              obj[field] = errs.map(e => e.message).join(', ');
            }
          );
          if (!Object.keys(errors).length) {
            // redux-form specific fields:
            errors._error = `Unable to update project: ${err.message}`;
          }
          return rej(errors);
        }

        dispatch(setProject(proj));
        app.notifications.push({
          level: 'success',
          message: 'Project updated successfully',
        });
        res();
      }));
    });
  }

  render() {
    const {
      consortia,
      error,
      fields: { name, consortium, analysis },
    } = this.props;

    let errorAlert;
    let nameHelpBlock;
    let nameValidationState;

    if (errorAlert) {
      errorAlert = <Alert bsStyle="danger"><p>{error}</p></Alert>;
    }

    if (name.error) {
      nameHelpBlock = <HelpBlock>{name.error}</HelpBlock>;
      nameValidationState = 'danger';
    }

    return (
      <div>
        <BackButton to="/projects" />
        <form onSubmit={this.props.handleSubmit(this.submit.bind(this))}>
          <FormProjectContext
            { ...{
              consortium, analysis, consortia,
            }}
            consortiumLabel="Default Consortium:"
            analysisLabel="Default Analysis:"
          />
          <FormGroup
            controlId="edit-project-name"
            validationState={nameValidationState}
          >
            <ControlLabel>Name</ControlLabel>
            <FormControl placeholder="Project Name" type="text" {...name} />
            {nameHelpBlock}
          </FormGroup>

          {errorAlert}

          <Button
            id="save"
            type="submit"
            bsStyle="primary"
          >
            <span className="glyphicon glyphicon-ok" aria-hidden="true">&nbsp;</span>
            Save
          </Button>
        </form>
      </div>
    );
  }
}

FormEditProject.propTypes = {
  consortia: PropTypes.array.isRequired,
  error: PropTypes.string,
  fields: PropTypes.object.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  patchProject: PropTypes.func.isRequired,
  project: PropTypes.object.isRequired,
  projectModel: PropTypes.object.isRequired,
};

export default reduxForm(
  {
    form: 'formEditProject',
    fields: [
      'name',
      'consortium',
      'analysis',
    ],
    returnRejectedSubmitPromise: false,
  },
  state => {
    // map project fields to form fields.  they're ¯\_(almost-the-same)_/¯
    return {
      initialValues: {
        name: _.get(state.project, 'name'),
        consortium: _.get(state.project, 'defaultConsortiumId'),
        analysis: _.get(state.project, 'defaultAnalysisId'),
      },
    };
  }
)(FormEditProject);

