import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useQuery } from '@apollo/client';
import PropTypes from 'prop-types';
import get from 'lodash/get';

import { isUserInGroup } from '../../../utils/helpers';
import { FETCH_ALL_CONSORTIA_QUERY } from '../../../state/graphql/functions';

function getActiveTime(hoursSinceActive) {
  return Date.now() - (hoursSinceActive * 60 * 60 * 1000);
}

/**
 * This effect selects the runs that are displayed in the home page
 * @param {number} hoursSinceActiveFilter filter the runs that started in a time span
 * @param {string} runStatusFilter filter runs with certain status
 * @returns runs that should be displayed in the home page
 */
function useSelectRunsOfInterest(hoursSinceActiveFilter = 72, runStatusFilter = '') {
  const [filteredRuns, setFilteredRuns] = useState([]);

  const locallySavedRuns = useSelector(state => state.runs.runs);
  const authUser = useSelector(state => state.auth.user);

  const { data } = useQuery(FETCH_ALL_CONSORTIA_QUERY, { fetchPolicy: 'cache-only' });

  const consortia = get(data, 'fetchAllConsortia', []);

  useEffect(() => {
    if (!locallySavedRuns) return [];

    const activeTime = getActiveTime(hoursSinceActiveFilter);

    const filteredRuns = locallySavedRuns.filter((run) => {
      const consortium = consortia.find(con => con.id === run.consortiumId);

      return (!runStatusFilter || run.status === runStatusFilter)
        && (run.startDate > activeTime || run.endDate > activeTime)
        && consortium
        && (
          authUser.id in run.observers
          || (run.sharedUsers && isUserInGroup(authUser.id, run.sharedUsers))
        );
    });

    setFilteredRuns(filteredRuns);
  }, [locallySavedRuns, consortia]);

  return filteredRuns;
}

useSelectRunsOfInterest.propTypes = {
  runStatusFilter: PropTypes.string,
};

export default useSelectRunsOfInterest;
