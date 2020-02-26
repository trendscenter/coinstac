import React from 'react';
import PropTypes from 'prop-types';
import { ipcRenderer } from 'electron';
import { connect } from 'react-redux';
import { compose, graphql, withApollo } from 'react-apollo';
import { FETCH_ALL_USER_RUNS_QUERY } from '../../../state/graphql/functions';
import { notifyInfo } from '../../../state/ducks/notifyAndLog';

class DashboardMappedDataListener extends React.Component {
  componentDidUpdate(prevProps) {
    const {
      maps,
      consortia,
      userRuns,
      notifyInfo,
      router,
    } = this.props;

    if (prevProps.maps.length < maps.length) {
      const lastDataMapping = maps[maps.length - 1];
      const consortium = consortia.find(c => lastDataMapping.consortiumId === c.id);

      if (this.checkIfConsortiumHasActiveRun(consortium)) {
        notifyInfo({
          message: `Pipeline Starting for ${consortium.name}.`,
          action: {
            label: 'Watch Progress',
            callback: () => {
              router.push('dashboard');
            },
          },
        });

        const run = userRuns[userRuns.length - 1];

        ipcRenderer.send('start-pipeline', {
          consortium, lastDataMapping, run,
        });
      }
    }
  }

  checkIfConsortiumHasActiveRun = (consortium) => {
    // TODO: filter by consortium
    const { userRuns } = this.props;

    if (!userRuns || !userRuns.length) {
      return false;
    }

    const lastRun = userRuns[userRuns.length - 1];

    return !lastRun.endDate;
  }

  render() {
    return null;
  }
}

DashboardMappedDataListener.propTypes = {
  maps: PropTypes.array.isRequired,
};

const ComponentWithData = compose(
  graphql(FETCH_ALL_USER_RUNS_QUERY, {
    props: ({ data }) => ({
      userRuns: data.fetchAllUserRuns,
      refetchUserRuns: data.refetch,
    }),
    options: props => ({
      variables: { userId: props.auth.user.id },
    }),
  }),
  withApollo
)(DashboardMappedDataListener);

function mapStateToProps({ auth, maps }) {
  return {
    auth,
    maps: maps.consortiumDataMappings,
  };
}

const connectedComponent = connect(mapStateToProps,
  {
    notifyInfo,
  })(ComponentWithData);

export default connectedComponent;
