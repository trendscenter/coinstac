import app from 'ampersand-app';
import { connect } from 'react-redux';
import React, { Component, PropTypes } from 'react';

import { hilarious } from '../utils/hilarious-loading-messages';
import ConsortiumSingle from './consortium-single';
import { fetchComputations } from '../state/ducks/computations';
import {
  addConsortiumComputationListener,
  listenToConsortia,
  unlistenToConsortia,
} from '../state/ducks/bg-services';
import {
  joinConsortium,
  leaveConsortium,
  setActiveComputation,
} from '../state/ducks/consortia';
import {
  fetch as fetchRemoteResults,
  setRemoteResults,
} from '../state/ducks/remote-results';

class ConsortiumSingleController extends Component {
  constructor(props) {
    super(props);

    this.addUser = this.addUser.bind(this);
    this.removeUser = this.removeUser.bind(this);
    this.updateComputation = this.updateComputation.bind(this);
  }

  componentWillMount() {
    const {
      dispatch,
      params: { _id: consortiumId },
    } = this.props;

    dispatch(fetchRemoteResults(consortiumId));
    dispatch(fetchComputations()); // @TODO never set. let background service keep up to date
  }

  componentWillUnmount() {
    const { dispatch } = this.props;

    dispatch(setRemoteResults(null));
  }

  addUser(username) {
    const { dispatch, consortium: { _id: consortiumId } } = this.props;

    dispatch(joinConsortium(consortiumId, username))
    .then((tium) => {
      // TODO: Figure out a better way to initiate this background service
      listenToConsortia(tium);
      addConsortiumComputationListener(tium);

      app.logger.info(`now listening to events on consortium ${tium.label}`);
    });
  }

  updateComputation(evt) {
    const { dispatch, consortium: { _id: consortiumId } } = this.props;
    const { target: { value: computationId } } = evt;

    dispatch(setActiveComputation(consortiumId, computationId));
  }

  removeUser(username) {
    const { dispatch, consortium: { _id: consortiumId } } = this.props;

    dispatch(leaveConsortium(consortiumId, username))
    .then(() => {
      // TODO: Figure out a better way to initiate this background service
      unlistenToConsortia(consortiumId);

      app.notify('success', `${username} removed`);
    })
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

function mapStateToProps(state, ownProps) {
  const {
    computations,
    consortia,
    loading,
    auth,
    remoteResults,
  } = state;
  const { params: { _id: consortiumId } } = ownProps;

  return {
    auth,
    computations,
    consortium: consortia.find(tium => tium._id === consortiumId),
    consortia,
    loading: { loading },
    remoteResults,
  };
}

export default connect(mapStateToProps)(ConsortiumSingleController);
