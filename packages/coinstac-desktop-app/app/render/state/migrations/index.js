import { get } from 'lodash';

const migrations = {
  1: (state) => {
    // Add observers property to local runs
    const localRuns = get(state, 'localRuns', [])
      .map(localRun => ({
        ...localRun,
        observers: localRuns.clients,
      }));

    return {
      ...state,
      localRuns,
    };
  },
  2: (state) => {
    // Add observers property to local runs
    const localRuns = get(state, 'localRuns', [])
      .map(localRun => ({
        ...localRun,
        shouldUploadAssets: false,
        assetsUploaded: false,
      }));

    return {
      ...state,
      localRuns,
    };
  },
};

export default migrations;
