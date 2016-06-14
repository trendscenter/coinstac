import { fetchProject, setProject, saveProject, addFile, removeFile } from 'app/render/state/ducks/project'; // eslint-disable-line
import { fetchConsortium } from 'app/render/state/ducks/consortium';
import { fetchConsortia } from 'app/render/state/ducks/consortia';
import { hilarious } from 'app/render/utils/hilarious-loading-messages';
import { connect } from 'react-redux';
import PageProject from './page-project';
import async from 'async';
import React from 'react';
import _ from 'lodash';

class PageProjectController extends React.Component {

  constructor(props) {
    super(props);
    this.state = {};
    const { dispatch, consortia } = props;
    const { projectId } = this.props.params;
    const actionCreators = [_.partial(fetchProject, projectId), fetchConsortia];
    const asyncDispatch = (actionCreator, cb) => dispatch(actionCreator(cb));
        // fetch models for component state: project, consortia
    async.each(actionCreators, asyncDispatch, (err) => {
      const { project } = this.props;
      if (err) { return; }
      if (project.defaultConsortiumId) {
        dispatch(fetchConsortium(project.defaultConsortiumId));
        this.setState({ ready: true });
      }
    });
  }

  componentWillUnmount() {
    const { dispatch } = this.props;
    dispatch(setProject(null));
    // dispatch(setAnalysis(null));
  }

  deleteFile(file) {
    const { dispatch } = this.props;
    dispatch(removeFile(file));
  }

  triggerAddFiles() {
    const { project, dispatch } = this.props;
    dispatch(addFile(project));
  }

  toggleControlTag(files) {
    const { project, dispatch } = this.props;
    files = _.isArray(files) ? files : [files];
    files.forEach(file => {
      const toUpdate = project.files.find(f => f.filename === file.filename);
      _.set(toUpdate, 'tags.control', !_.get(toUpdate, 'tags.control'));
    });
    dispatch(setProject(project));
  }

  render() {
    if (!this.state.ready) {
      return (<span>{hilarious.random()}</span>);
    }
    return (
      <div className="projects-single">
        <PageProject
          { ...this.props }
          deleteFile={this.deleteFile.bind(this)}
          triggerAddFiles={this.triggerAddFiles.bind(this)}
          toggleControlTag={this.toggleControlTag.bind(this)}
        />
      </div>
    );
  }
}

PageProjectController.propTypes = {
  dispatch: React.PropTypes.func.isRequired,
  params: React.PropTypes.object.isRequired,
  projectId: React.PropTypes.string,
  project: React.PropTypes.object,
};

function select(state) {
  return {
    consortia: state.consortia,
    consortium: state.consortium,
    project: state.project,
    loading: state.loading,
  };
}
export default connect(select)(PageProjectController);
