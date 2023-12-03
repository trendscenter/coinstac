import { useEffect } from 'react';
import { connect } from 'react-redux';
import { useSubscription, useApolloClient } from '@apollo/client';
import { get } from 'lodash';

import {
  CONSORTIUM_PIPELINE_CHANGED_SUBSCRIPTION,
  FETCH_ALL_PIPELINES_QUERY,
  FETCH_ALL_COMPUTATIONS_QUERY,
} from '../../../state/graphql/functions';
import { notifyInfo } from '../../../state/ducks/notifyAndLog';
import { pullComputations } from '../../../state/ducks/docker';

/**
 * Pulls computation images automatically once the pipeline is set for a given consortium.
 */
function PullComputationsListener({
  userId,
  notifyInfo,
  pullComputations,
  containerStatus,
}) {
  const { data } = useSubscription(CONSORTIUM_PIPELINE_CHANGED_SUBSCRIPTION);
  const apolloClient = useApolloClient();

  const consortium = get(data, 'consortiumPipelineChanged');

  useEffect(() => {
    if (!consortium || !(userId in consortium.activeMembers) || !containerStatus) return;

    const pipelineData = apolloClient.readQuery({ query: FETCH_ALL_PIPELINES_QUERY });
    const computationData = apolloClient.readQuery({ query: FETCH_ALL_COMPUTATIONS_QUERY });

    if (!consortium.activePipelineId) {
      return;
    }

    const pipeline = pipelineData.fetchAllPipelines
      .find(p => p.id === consortium.activePipelineId);

    if (!pipeline) {
      return;
    }

    const computations = [];

    pipeline.steps.forEach((step) => {
      const compObject = computationData.fetchAllComputations
        .find(comp => comp.id === step.computations[0].id);
      computations.push({
        img: compObject.computation.dockerImage,
        compId: compObject.id,
        compName: compObject.meta.name,
      });
    });

    if (computations.length) {
      pullComputations({ consortiumId: consortium.id, computations });
      notifyInfo('Pipeline computations downloading via Docker.');
    }
  }, [consortium]);

  return null;
}

export default connect(null,
  {
    notifyInfo,
    pullComputations,
  })(PullComputationsListener);
