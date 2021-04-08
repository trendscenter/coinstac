const { gql } = require('@apollo/client/core');
const { queries } = require('coinstac-graphql-schema');
const { startPipelineRun } = require('./pipeline-run-manager');

const RUN_WITH_HEADLESS_CLIENT_STARTED_SUBSCRIPTION = gql`
  subscription runWithHeadlessClientStarted($clientId: ID)
    ${queries.runWithHeadlessClientStarted}
`;

function subscribeToNewRuns(clientId, apolloClient) {
  apolloClient.subscribe({
    query: RUN_WITH_HEADLESS_CLIENT_STARTED_SUBSCRIPTION,
    variables: { clientId },
  }).subscribe({
    next: (data) => {
      const run = data.data.runWithHeadlessClientStarted;
      startPipelineRun(run);
    },
    error: (error) => {
      console.error('An error occurred on the new runs subscription', error);
    },
  });
}

module.exports = subscribeToNewRuns;
