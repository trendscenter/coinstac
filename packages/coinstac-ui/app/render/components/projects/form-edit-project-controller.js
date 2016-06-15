import partial from 'lodash/partial';
import cloneDeep from 'lodash/cloneDeep';
import React, { PropTypes } from 'react';
import async from 'async';
import { connect } from 'react-redux';
import { fetchProject, setProject, saveProject } from 'app/render/state/ducks/project';
import { fetchConsortia } from 'app/render/state/ducks/consortia';
import FormEditProject from './form-edit-project';

/**
 * @class FormEditProjectContoller
 * Defines controlling logic for managing of a project
 * @note a key element to this form is the `project` Model.  When the project changes,
 * the redux state is change as well.  This is because we bind model changes to the
 * redux action definitions, which triggers a full state re-render.
 */
class FormEditProjectController extends React.Component {

  constructor(props) {
    super(props);
    this.stateReady = false;
    const { dispatch, params: { projectId } } = props;
    const actionCreators = [partial(fetchProject, projectId), fetchConsortia];
    const asyncDispatch = (actionCreator, cb) => dispatch(actionCreator(cb));
    const { router } = this.context;

    async.each(actionCreators, asyncDispatch, (err) => {
      if (err) {
        router.push('/projects');
      }

      this.stateReady = true;
    });
  }

  componentWillUnmount() {
    const { dispatch } = this.props;
    dispatch(setProject(null));
  }

  patchProject(field, value, evt) {
    const { project, dispatch } = this.props;
    var patched = cloneDeep(project);
    patched[field] = value;
    dispatch(saveProject(patched, { toState: true }));
  }

  render() {
    const { project } = this.props;
    if (!this.stateReady) {
      return <span>Loading...</span>;
    }
    return (
            <FormEditProject
              { ...this.props }
              { ...{
                setDefaultConsortium: evt => this.patchProject('defaultConsortiumId', evt.target.value, evt),
                setDefaultAnalysis: evt => this.patchProject('defaultAnalysisId', evt.target.value, evt)
              } }
            />
        );
  }
}

FormEditProjectController.contextTypes = {
  router: PropTypes.object.isRequired,
};

function select(state) {
  return {
    consortia: state.consortia,
    project: state.project,
    loading: state.loading,
  };
}
export default connect(select)(FormEditProjectController);
