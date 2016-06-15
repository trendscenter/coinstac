import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { hilarious } from 'app/render/utils/hilarious-loading-messages';
import ConsortiumSingle from './consortium-single';
import { fetchComputations } from 'app/render/state/ducks/computations';
import { unlistenToConsortia, listenToConsortia } from 'app/render/state/ducks/bg-services';
import { saveConsortium, setConsortium } from 'app/render/state/ducks/consortium';
import { fetch as fetchRemoteResults, setRemoteResults } from 'app/render/state/ducks/remote-results';  // eslint-disable-line
import without from 'lodash/without';
import noop from 'lodash/noop';
import app from 'ampersand-app';

class ConsortiumSingleController extends Component {

  componentWillMount() {
    const { dispatch, params: { _id: consortiumId }, consortia } = this.props;
    this.addUser = this.addUser.bind(this);
    this.removeUser = this.removeUser.bind(this);
    const consortium = consortia.find(tium => tium._id === consortiumId);
    if (!consortium) { throw new ReferenceError(`consortium ${consortiumId} not found`); }
    dispatch(setConsortium(consortium));
    dispatch(fetchRemoteResults(consortium._id));
    dispatch(fetchComputations()); // @TODO never set. let background service keep up to date
    this.updateComputation = this.updateComputation.bind(this);
  }

  componentWillUnmount() {
    const { dispatch } = this.props;
    dispatch(setConsortium(null));
    dispatch(setRemoteResults(null));
  }

  addUser(username) {
    const { dispatch, consortium } = this.props;
    consortium.users.push(username);
    dispatch(saveConsortium(consortium))
    .then((tium) => {
      dispatch(listenToConsortia(tium));
      app.logger.info(`now listening to events on consortium ${tium.label}`);
    });
  }

  updateComputation(evt) {
    const { dispatch, consortium } = this.props;
    const computationId = evt.target.value;
    consortium.activeComputationId = computationId;
    dispatch(saveConsortium(consortium));
  }

  removeUser(username) {
    const { dispatch, consortium } = this.props;
    consortium.users = without(consortium.users, username);
    dispatch(saveConsortium(consortium))
    .then(() => dispatch(unlistenToConsortia(consortium.id)))
    .then(() => app.notify('success', `${username} removed`))
    .catch((err) => app.notify('error', err.message));
  }

  render() {
    const { auth, computations, consortium, loading, remoteResults } = this.props;
    if (!consortium || !remoteResults || !computations) { return (<span>{hilarious.random()}</span>); }
    return (
      <ConsortiumSingle
        addUser={this.addUser}
        computations={computations}
        consortium={consortium}
        user={auth.user}
        updateComputation={this.updateComputation}
        isMember={consortium.users.some(un => un === auth.user.username)}
        removeUser={this.removeUser}
        remoteResults={remoteResults || []}
        { ...loading }
      />
    );
  }
}

ConsortiumSingleController.displayName = 'ConsortiumSingleController';

ConsortiumSingleController.propTypes = {
  auth: PropTypes.object,
  computations: PropTypes.array.isRequired,
  consortium: PropTypes.object,
  consortia: PropTypes.array.isRequired,
  dispatch: PropTypes.func.isRequired,
  loading: PropTypes.object.isRequired,
  params: PropTypes.object.isRequired,
  remoteResults: PropTypes.array,
};

function mapStateToProps(state) {
  const { computations, consortia, consortium, loading, auth, remoteResults } = state; // eslint-disable-line
  return {
    computations,
    consortia,
    consortium,
    remoteResults,
    loading: { loading },
    auth,
  };
}

export default connect(mapStateToProps)(ConsortiumSingleController);
