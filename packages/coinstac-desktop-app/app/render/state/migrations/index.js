import { get } from 'lodash';

const migrations = {
  1: (state) => {
    // Add observers property to local runs
    const localRuns = get(state, 'runs.localRuns', [])
      .map(localRun => ({
        ...localRun,
        observers: localRuns.clients,
      }));

    return {
      ...state,
      runs: {
        ...state.runs,
        localRuns,
      },
    };
  },
  2: (state) => {
    // Add observers property to local runs
    const localRuns = get(state, 'runs.localRuns', [])
      .map(localRun => ({
        ...localRun,
        shouldUploadAssets: false,
        assetsUploaded: false,
      }));

    return {
      ...state,
      runs: {
        ...state.runs,
        localRuns,
      },
    };
  },
};

export default migrations;
