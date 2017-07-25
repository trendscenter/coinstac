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
    const {
      consortium,
      fetchComputations,
      fetchRemoteResults,
      isNew,
    } = this.props;

    if (!isNew) {
      fetchRemoteResults(consortium._id);
      // TODO never set. let background service keep up to date
      fetchComputations();
    }
  }

  componentWillUnmount() {
    const { isNew } = this.props;

    if (!isNew) {
      this.props.setRemoteResults(null);
    }
  }

  onSubmit(consortium) {
    const { isNew, username } = this.props;

    const toSave = isNew ?
      // New consortium:
      Object.assign({}, consortium, {
        owners: [username],
        users: [username],
      }) :

      // Editing consortium:
      consortium;


    this.props.saveConsortium(toSave)
      .then(() => {
        this.context.router.push('/consortia');
      })
      .catch((error) => {
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
    const {
      addConsortiumComputationListener,
      consortium: { _id: consortiumId },
      joinConsortium,
      listenToConsortia,
    } = this.props;

    joinConsortium(consortiumId, username)
    .then((tium) => {
      // TODO: Figure out a better way to initiate this background service
      listenToConsortia(tium);
      addConsortiumComputationListener(tium);

      app.logger.info(`now listening to events on consortium ${tium.label}`);
    });
  }

  removeUser(username) {
    const {
      consortium: { _id: consortiumId },
      leaveConsortium,
      unlistenToConsortia,
    } = this.props;

    leaveConsortium(consortiumId, username)
    .then(() => {
      // TODO: Figure out a better way to initiate this background service
      unlistenToConsortia(consortiumId);

      app.notify({
        level: 'success',
        message: `${username} removed`,
      });
    })
    .catch(err => app.notify({
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
  addConsortiumComputationListener: PropTypes.func,
  computations: PropTypes.arrayOf(PropTypes.object).isRequired,
  consortium: PropTypes.object,
  fetchComputations: PropTypes.func,
  fetchRemoteResults: PropTypes.func,
  initialResultId: PropTypes.string,
  isLoading: PropTypes.bool.isRequired,
  isMember: PropTypes.bool.isRequired,
  isNew: PropTypes.bool.isRequired,
  isOwner: PropTypes.bool.isRequired,
  joinConsortium: PropTypes.func,
  leaveConsortium: PropTypes.func,
  listenToConsortia: PropTypes.func,
  remoteResults: PropTypes.arrayOf(PropTypes.object).isRequired,
  saveConsortium: PropTypes.func,
  setRemoteResults: PropTypes.func,
  unlistenToConsortia: PropTypes.func,
  username: PropTypes.string.isRequired,
};

ConsortiumController.defaultProps = {
  consortium: null,
  initialResultId: null,
};

function mapStateToProps(state, { params: { consortiumId, resultId } }) {
  const {
    auth: {
      user: { username },
    },
    computations,
    consortia: { allConsortia },
    loading: { isLoading },
    remoteResults,
  } = state;
  const isNew = !consortiumId;
  const consortium = !isNew ?
    allConsortia.find(({ _id }) => _id === consortiumId) :
    null;

  return {
    // TODO: Ensure computations is always an array in the state tree
    computations: (computations || [])
      .sort((a, b) => `${a.name}@${a.version}` > `${b.name}@${b.version}`),
    consortium,
    initialResultId: resultId,
    isLoading,
    isMember: isNew ? true : consortium.users.indexOf(username) > -1,
    isNew,
    isOwner: isNew ? true : consortium.owners.indexOf(username) > -1,
    remoteResults: remoteResults || [],
    username,
  };
}

export default connect(mapStateToProps, {
  fetchRemoteResults,
  fetchComputations,
  setRemoteResults,
  saveConsortium,
  joinConsortium,
  leaveConsortium,
  addConsortiumComputationListener,
  listenToConsortia,
  unlistenToConsortia,
})(ConsortiumController);
