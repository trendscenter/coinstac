import { useRef, useEffect } from 'react';
import { useQuery, useSubscription } from '@apollo/client';
import { get } from 'lodash';
import { useSelector, useDispatch } from 'react-redux';

import { FETCH_ALL_CONSORTIA_QUERY, RUN_STARTED_SUBSCRIPTION } from '../../../state/graphql/functions';
import { startRun } from '../../../state/ducks/runs';

/*
 * This effect checks if there are runs that must be started locally when the app first starts.
 */
function useStartDecentralizedRun() {
  const dispatch = useDispatch();

  const auth = useSelector(state => state.auth);

  const { data } = useQuery(FETCH_ALL_CONSORTIA_QUERY);
  const { data: runSubData } = useSubscription(RUN_STARTED_SUBSCRIPTION, {
    variables: {
      userId: auth.user.id,
    },
    skip: !auth || !auth.user || !auth.user.id,
  });

  const consortia = get(data, 'fetchAllConsortia');

  useEffect(() => {
    const run = get(runSubData, 'runStarted');

    if (!run || run.status !== 'started') return;

    const consortium = consortia.find(c => c.id === run.consortiumId);

    dispatch(startRun(run, consortium));
  }, [runSubData]);
}

export default useStartDecentralizedRun;
