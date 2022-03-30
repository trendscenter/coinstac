const { gql } = require('@apollo/client/core');
const { queries } = require('coinstac-graphql-schema');

const RUN_WITH_HEADLESS_CLIENT_STARTED_SUBSCRIPTION = gql`
  subscription runWithHeadlessClientStarted($clientId: ID)
    ${queries.runWithHeadlessClientStarted}
`;

function subscribeToNewRuns(clientId, apolloClient, runManager) {
  apolloClient.subscribe({
    query: RUN_WITH_HEADLESS_CLIENT_STARTED_SUBSCRIPTION,
    variables: { clientId },
  }).subscribe({
    next: (data) => {
      const run = data.data.runWithHeadlessClientStarted;
      runManager.startPipelineRun(run)
        // eslint-disable-next-line no-console
        .catch(e => console.error(`An error occurred on during a run: ${e}`));
    },
    error: (error) => {
      // eslint-disable-next-line no-console
      console.error('An error occurred on the new runs subscription', error);
    },
  });
}

module.exports = subscribeToNewRuns;
