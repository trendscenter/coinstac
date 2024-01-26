/* eslint-disable no-console */
import { useRef, useEffect } from 'react';
import { useLazyQuery, useQuery } from '@apollo/client';
import { get } from 'lodash';
import { useDispatch, useSelector } from 'react-redux';

import { FETCH_ALL_USER_RUNS_QUERY, FETCH_ALL_CONSORTIA_QUERY } from '../../../state/graphql/functions';
import { startRun } from '../../../state/ducks/runs';
import { selectSuspendedRunsStates } from '../../../state/ducks/suspendedRuns';

/*
 * This effect checks if there are runs that must be started locally when the app first starts.
 */
function useStartInitialRuns() {
  const suspendedRunsStates = useSelector(selectSuspendedRunsStates);
  const auth = useSelector(state => state.auth);

  const loggedUserId = get(auth, 'user.id');

  const dispatch = useDispatch();

  const ranFirstTime = useRef(false);

  const { data } = useQuery(FETCH_ALL_CONSORTIA_QUERY, {
    onError: (error) => { console.error({ error }); },
  });

  const [getAllRuns, { data: runsData }] = useLazyQuery(FETCH_ALL_USER_RUNS_QUERY);

  const consortia = get(data, 'fetchAllConsortia');

  useEffect(() => {
    if (!consortia || !consortia.length) return;

    getAllRuns();
  }, [ranFirstTime, consortia]);

  useEffect(() => {
    if (ranFirstTime.current || !runsData) return;
    ranFirstTime.current = true;

    const runs = get(runsData, 'fetchAllUserRuns');

    if (!runs) return;

    runs.forEach((run) => {
      if (run.status !== 'started' || run.id in suspendedRunsStates || !(loggedUserId in run.clients)) return;

      const consortium = consortia.find(c => c.id === run.consortiumId);

      dispatch(startRun(run, consortium));
    });
  }, [runsData]);
}

export default useStartInitialRuns;
