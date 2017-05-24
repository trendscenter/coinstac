import app from 'ampersand-app';
import { connect } from 'react-redux';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import {
  addConsortiumComputationListener,
  listenToConsortia,
  unlistenToConsortia,
} from '../../state/ducks/bg-services';
import Consortium from './consortium';
import { fetchComputations } from '../../state/ducks/computations';
import {
  joinConsortium,
  leaveConsortium,
  saveConsortium,
} from '../../state/ducks/consortia';
import {
  fetch as fetchRemoteResults,
  setRemoteResults,
} from '../../state/ducks/remote-results';

class ConsortiumController extends Component {
  constructor(props) {
    super(props);

    this.onSubmit = this.onSubmit.bind(this);
    this.onReset = this.onReset.bind(this);
    this.addUser = this.addUser.bind(this);
    this.removeUser = this.removeUser.bind(this);
  }

  componentWillMount() {
    const { consortium, dispatch, isNew } = this.props;

    if (!isNew) {
      dispatch(fetchRemoteResults(consortium._id));
      // TODO never set. let background service keep up to date
      dispatch(fetchComputations());
    }
  }

  componentWillUnmount() {
    const { dispatch, isNew } = this.props;

    if (!isNew) {
      dispatch(setRemoteResults(null));
    }
  }

  onSubmit(consortium) {
    const { dispatch, isNew, username } = this.props;

    const toSave = isNew ?
      // New consortium:
      Object.assign({}, consortium, {
        owners: [username],
        users: [username],
      }) :

      // Editing consortium:
      consortium;


    dispatch(saveConsortium(toSave))
      .then(() => {
        this.context.router.push('/consortia');
      })
      .catch(error => {
        app.notify({
          level: 'error',
          message: error.message,
        });
        console.error(error); // eslint-disable-line no-console
      });
  }

  onReset() {
    this.context.router.push('/consortia');
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

  removeUser(username) {
    const { dispatch, consortium: { _id: consortiumId } } = this.props;

    dispatch(leaveConsortium(consortiumId, username))
    .then(() => {
      // TODO: Figure out a better way to initiate this background service
      unlistenToConsortia(consortiumId);

      app.notify({
        level: 'success',
        message: `${username} removed`,
      });
    })
    .catch((err) => app.notify({
      level: 'error',
      message: err.message,
    }));
  }

  render() {
    const {
      computations,
      consortium,
      initialResultId,
      isLoading,
      isMember,
      isNew,
      isOwner,
      remoteResults,
      username,
    } = this.props;

    return (
      <Consortium
        addUser={this.addUser}
        computations={computations}
        consortium={consortium}
        initialResultId={initialResultId}
        isLoading={isLoading}
        isMember={isMember}
        isNew={isNew}
        isOwner={isOwner}
        onSubmit={this.onSubmit}
        onReset={this.onReset}
        remoteResults={remoteResults}
        removeUser={this.removeUser}
        username={username}
      />
    );
  }
}

ConsortiumController.contextTypes = {
  router: PropTypes.object.isRequired,
};

ConsortiumController.displayName = 'ConsortiumController';

ConsortiumController.propTypes = {
  computations: PropTypes.arrayOf(PropTypes.object).isRequired,
  consortium: PropTypes.object,
  dispatch: PropTypes.func.isRequired,
  initialResultId: PropTypes.string,
  isLoading: PropTypes.bool.isRequired,
  isMember: PropTypes.bool.isRequired,
  isNew: PropTypes.bool.isRequired,
  isOwner: PropTypes.bool.isRequired,
  remoteResults: PropTypes.arrayOf(PropTypes.object).isRequired,
  username: PropTypes.string.isRequired,
};

function mapStateToProps(state, { params: { consortiumId, resultId } }) {
  const {
    auth: {
      user: { username },
    },
    computations,
    consortia,
    loading: { isLoading },
    remoteResults,
  } = state;
  const isNew = !consortiumId;
  const initialResultId = resultId;
  const consortium = !isNew ?
    consortia.find(({ _id }) => _id === consortiumId) :
    null;

  return {
    // TODO: Ensure computations is always an array in the state tree
    computations: (computations || [])
      .sort((a, b) => `${a.name}@${a.version}` > `${b.name}@${b.version}`),
    consortium,
    initialResultId,
    isLoading,
    isMember: isNew ? true : consortium.users.indexOf(username) > -1,
    isNew,
    isOwner: isNew ? true : consortium.owners.indexOf(username) > -1,
    remoteResults: remoteResults || [],
    username,
  };
}

export default connect(mapStateToProps)(ConsortiumController);
