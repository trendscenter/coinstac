import { useQuery, useSubscription } from '@apollo/client';
import { get } from 'lodash';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { startRun } from '../../../state/ducks/runs';
import { FETCH_ALL_CONSORTIA_QUERY, RUN_STARTED_SUBSCRIPTION } from '../../../state/graphql/functions';

/**
 * This effect starts decentralized runs based on the RUN_STARTED_SUBSCRIPTION.
 *
 * The RUN_STARTED_SUBSCRIPTION has new data when a new decentralized run (of which the
 * current user is a part of) is started.
 */
function useStartDecentralizedRun() {
  const dispatch = useDispatch();

  const auth = useSelector(state => state.auth);

  const { data } = useQuery(FETCH_ALL_CONSORTIA_QUERY,
    {
      onError: (error) => {
        /* eslint-disable-next-line no-console */
        console.error({ error });
      },
    });
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
