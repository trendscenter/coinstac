import React, { Component, PropTypes } from 'react';
import { Alert } from 'react-bootstrap';
import { connect } from 'react-redux';
import { core, logger, notify } from 'ampersand-app';
import { flatten, sortBy } from 'lodash';

import StatusItem from './status-item.js';
import { fetch as fetchProjects } from '../state/ducks/projects.js';
import { fetchComputations } from '../state/ducks/computations.js';

class DashboardHome extends Component {
  constructor(props) {
    super(props);
    this.state = {
      remoteResults: [],
    };
  }

  componentWillMount() {
    const { dispatch } = this.props;

    dispatch(fetchComputations());
    // TODO: Modify action creator to use Promise
    dispatch(fetchProjects((error) => {
      if (error) {
        logger.error(error);
        notify('error', error.message);
      }
    }));

    this.getRemoteResults().then(() => {
      this.interval = setInterval(() => this.getRemoteResults(), 2000);
    });
  }

  componentWillUnmount() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  getRemoteResults() {
    const dbRegistry = core.dbRegistry;

    return dbRegistry.get('consortia')
      .all()
      .then((docs) => Promise.all(docs.map(({ _id }) =>
        dbRegistry.get(`remote-consortium-${_id}`).all()
      )))
      .then((responses) => {
        const remoteResults =
          sortBy(flatten(responses), ['endDate', 'startDate']).reverse();
        this.setState({ remoteResults });
        return remoteResults;
      })
      .catch((error) => {
        logger.error(error);
        notify('error', error.message);

        if (this.interval) {
          clearInterval(this.interval);
        }
      });
  }

  maybeRenderStatusItem({ computation, consortium, remoteResult }) {
    const isMember = consortium.users.indexOf(this.props.username) > -1;

    if (isMember) {
      return (
        <StatusItem
          computation={computation}
          consortium={consortium}
          remoteResult={remoteResult}
        />
      );
    }
  }

  render() {
    const {
      computations,
      consortia,
      projects,
      username,
    } = this.props;
    const {
      remoteResults,
    } = this.state;
    let statusItems = [];

    if (
      remoteResults.length &&
      computations.length &&
      consortia.length
    ) {
      Array.prototype.push.apply(
        statusItems,
        remoteResults.reduce((memo, remoteResult) => {
          const computation = computations.find(
            ({ _id }) => _id === remoteResult.computationId
          );
          const consortium = consortia.find(
            ({ _id }) => _id === remoteResult.consortiumId
          );
          const project = projects.find(
            ({ consortiumId }) => consortiumId === consortium._id
          );
          const isMember = consortium.users.indexOf(username) > -1;

          if (isMember) {
            return memo.concat(this.maybeRenderStatusItem({
              computation,
              consortium,
              project,
              remoteResult,
            }));
          }

          return memo;
        }, [])
      );
    }

    if (!statusItems.length) {
      statusItems = [<Alert>No computation results</Alert>];
    }

    return (
      <div className="dashboard-home">
        <h1 className="h2">Computation statuses:</h1>
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
  })).isRequired,
  consortia: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string.isRequired,
    owners: PropTypes.arrayOf(PropTypes.string).isRequired,
    users: PropTypes.arrayOf(PropTypes.string).isRequired,
  })).isRequired,
  dispatch: PropTypes.func.isRequired,
  projects: PropTypes.arrayOf(PropTypes.shape({
    allowComputationRun: PropTypes.bool.isRequired,
    consortiumId: PropTypes.string.isRequired,
    status: PropTypes.oneOf([
      'active',
      'complete',
      'error',
      'waiting',
    ]).isRequired,
  })).isRequired,
  username: PropTypes.string.isRequired,
};

function mapStateToProps({
  auth,
  computations,
  consortia,
  projects,
  remoteResults,
}) {
  return {
    computations: computations || [],
    consortia: consortia || [],
    projects: projects || [],
    remoteResults: remoteResults || [],
    username: auth.user.username,
  };
}

export default connect(mapStateToProps)(DashboardHome);
