import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { ipcRenderer } from 'electron';
import { connect } from 'react-redux';
import { notifyInfo } from '../../../state/ducks/notifyAndLog';

function StartPipelineListener({
  maps, consortia, remoteRuns, localRuns, localRunResults, notifyInfo, networkVolume,
}) {
  function startPipeline(consortium, dataMapping, run) {
    notifyInfo(`Pipeline Starting for ${consortium.name}.`);

    ipcRenderer.send('start-pipeline', {
      consortium, dataMappings: dataMapping, pipelineRun: run, networkVolume
    });
  }

  function startPipelineIfHasActiveRun() {
    const lastDataMapping = maps[maps.length - 1];

    if (!lastDataMapping) {
      return;
    }

    const consortium = consortia.find(c => lastDataMapping.consortiumId === c.id);

    const run = remoteRuns.find(run => run.consortiumId === consortium.id
      && !run.results && !run.error);

    if (run) {
      startPipeline(consortium, lastDataMapping, run);
    }
  }

  function startRemoteRunsLocally() {
    remoteRuns.forEach((remoteRun) => {
      if (localRuns.findIndex(run => run.id === remoteRun.id) > -1) {
        return;
      }

      if (remoteRun.results || remoteRun.error || (remoteRun.id in localRunResults)) {
        return;
      }

      const consortium = consortia.find(c => c.id === remoteRun.consortiumId);
      const dataMapping = maps.find(m => m.consortiumId === consortium.id
        && m.pipelineId === consortium.activePipelineId);

      if (!dataMapping) {
        notifyInfo(`Run for ${consortium.name} is waiting for your data. Please map your data to take part of the consortium.`);
        return;
      }

      startPipeline(consortium, dataMapping, remoteRun);
    });
  }

  useEffect(() => {
    if (!maps || !consortia) {
      return;
    }

    startPipelineIfHasActiveRun();
  }, [maps, consortia]);

  useEffect(() => {
    if (!remoteRuns || !consortia) {
      return;
    }

    startRemoteRunsLocally();
  }, [remoteRuns, consortia]);

  return null;
}

StartPipelineListener.propTypes = {
  consortia: PropTypes.array.isRequired,
  localRuns: PropTypes.array.isRequired,
  localRunResults: PropTypes.object.isRequired,
  maps: PropTypes.array.isRequired,
  networkVolume: PropTypes.bool.isRequired,
  remoteRuns: PropTypes.array.isRequired,
  notifyInfo: PropTypes.func.isRequired,
};

const mapStateToProps = ({
  auth, runs, maps, localRunResults,
}) => ({
  networkVolume: auth.networkVolume,
  localRuns: runs.runs,
  localRunResults,
  maps: maps.consortiumDataMappings,
});

export default connect(mapStateToProps,
  {
    notifyInfo,
  })(StartPipelineListener);
