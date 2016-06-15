import _ from 'lodash';
import { Button, ButtonToolbar } from 'react-bootstrap';
import React, { Component, PropTypes } from 'react';
import { reduxForm } from 'redux-form';
import BackButton from 'app/render/components/controls/buttons/back';
import FormProjectContext from './form-project-context.js';
import ProjectFiles from './project-files';

class PageProject extends Component {
  // componentWillReceiveProps(newProps) {
  //   const { consortium, analysis, values } = newProps;
  //   const consortiumField = _.get(this.props, 'fields.consortium');
  //   const analysisField = _.get(this.props, 'fields.analysis');
  //   const consortiumId = consortium ? consortium._id : null;
  //   const analysisId = analysis ? analysis.id : null;
  //
  //   // if (!consortiumField.value && !consortiumId) {
  //   //     // then relax
  //   // } else if (consortiumField.value !== consortiumId) {
  //   //     // recall, redux doesn't like undefined state.  use `null`
  //   //     this.props.setConsortium(consortiumField.value ? consortiumField.value : null);
  //   // }
  //   // if (!analysisField.value && !analysisId) {
  //   //     // again, relax (otherwise risk an infinite loop)
  //   // } else if (analysisField.value !== analysisId) {
  //   //     this.props.setAnalysis(analysisField.value ? analysisField.value : null);
  //   // }
  // }

  // handleSubmitAnalyze(formValues, dispatch) {
  //   const { project: { consortium, files } } = this.props;
  //   // runAnalysis({
  //   //     consortiumId: consortium._id,
  //   //     files,
  //   //     predictors: [selectedAnalysis.predictor],
  //   // })
  //   //     .catch(error => {
  //   //         app.notifications.push({
  //   //             level: 'error',
  //   //             message: error.message,
  //   //         });
  //   //         console.error(error);
  //   //     });
  //   // addConsortiumAggregateListener(consortium._id);
  // }

  render() {
    const { consortia, fields, project, values } = this.props;

    return (
      <form
        className="clearfix"
        onSubmit={this.props.handleSubmit(this.handleSubmitAnalyze)}
      >
        <BackButton to="/projects" />
        <FormProjectContext consortia={consortia} {...fields} />
        <ButtonToolbar className="pull-right">
          <Button
            id="analyze"
            type="submit"
            bsStyle="primary"
            disabled={!values.analysis || !project.files.length}
          >
            <span className="glyphicon glyphicon-cloud-upload" aria-hidden="true">{' '}</span>
            Analyze
          </Button>
        </ButtonToolbar>
        <ProjectFiles
          project={project}
          deleteFile={this.props.deleteFile}
          triggerAddFiles={this.props.triggerAddFiles}
          toggleControlTag={this.props.toggleControlTag}
          handleFileSearch={this.props.handleFileSearch}
          handleFileDelete={this.props.handleFileDelete}
        />
      </form>
    );
  }
}

PageProject.propTypes = {
  analysis: PropTypes.object.isRequired,
  consortia: PropTypes.array.isRequired,
  consortium: PropTypes.object,
  deleteFile: PropTypes.func.isRequired,
  dispatch: PropTypes.func.isRequired,
  handleFileDelete: PropTypes.func.isRequired,
  handleFileSearch: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  fields: PropTypes.object,
  project: PropTypes.object.isRequired,
  toggleControlTag: PropTypes.func.isRequired,
  triggerAddFiles: PropTypes.func.isRequired,
  values: PropTypes.array.isRequired,
};

export default reduxForm(
  {
    form: 'formPageProject',
    fields: [
      'consortium',
      'analysis',
      'files',
    ],
    returnRejectedSubmitPromise: false,
  },
  state => {
    return {
      initialValues: {
        name: _.get(state.project, 'name'),
        consortium: _.get(state.project, 'defaultConsortiumId'),
        analysis: _.get(state.project, 'defaultAnalysisId'),
      },
    };
  }
)(PageProject);

