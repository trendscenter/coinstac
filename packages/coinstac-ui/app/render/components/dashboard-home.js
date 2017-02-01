import React, { Component, PropTypes } from 'react';
import { Alert } from 'react-bootstrap';
import StatusItem from './status-item.js';
import { connect } from 'react-redux';

import { fetch as fetchRemoteResults } from '../state/ducks/remote-results.js';
import { fetchComputations } from '../state/ducks/computations.js';

class DashboardHome extends Component {
  componentWillMount() {
    const { dispatch } = this.props;

    dispatch(fetchRemoteResults());
    dispatch(fetchComputations());
  }

  render() {
    const { computations, consortia, remoteResults, username } = this.props;
    let statusItems;

    if (
      Array.isArray(remoteResults) &&
      remoteResults.length &&
      Array.isArray(computations) &&
      computations.length &&
      Array.isArray(consortia) &&
      consortia.length
    ) {
      statusItems = remoteResults.reduce((memo, remoteResult) => {
        const computation = computations.find(
          ({ _id }) => _id === remoteResult.computationId
        );
        const consortium = consortia.find(
          ({ _id }) => _id === remoteResult.consortiumId
        );
        const isOwner = consortium.owners.indexOf(username) > -1;
        const isMember = consortium.users.indexOf(username) > -1;

        return isMember || isOwner ?
          memo.concat(
            <StatusItem
              computation={computation}
              isOwner={isOwner}
              remoteResult={remoteResult}
              status={'waiting'}
            />
          ) :
          memo;
      }, []);
    }

    if (!statusItems) {
      statusItems = [<Alert>No computation results</Alert>];
    }

    return (
      <div className="dashboard-home">
        <ul className="list-unstyled">
          {statusItems.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
    );
  }
}

DashboardHome.propTypes = {
  computations: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    version: PropTypes.string.isRequired,
  })),
  consortia: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string.isRequired,
    owners: PropTypes.arrayOf(PropTypes.string).isRequired,
    users: PropTypes.arrayOf(PropTypes.string).isRequired,
  })),
  dispatch: PropTypes.func.isRequired,
  remoteResults: PropTypes.arrayOf(PropTypes.shape({
    computationId: PropTypes.string.isRequired,
    consortiumId: PropTypes.string.isRequired,
    pipelineState: PropTypes.shape({
      step: PropTypes.number.isRequired,
    }).isRequired,
    pluginState: PropTypes.shape({
      'group-step': PropTypes.object,
    }),
    usernames: PropTypes.arrayOf(PropTypes.string).isRequired,
  })),
  username: PropTypes.string.isRequired,
};

function mapStateToProps({ auth, computations, consortia, remoteResults }) {
  return {
    computations,
    consortia,
    remoteResults,
    username: auth.user.username,
  };
}

export default connect(mapStateToProps)(DashboardHome);
