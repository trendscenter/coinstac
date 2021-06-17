import React from 'react';
import PropTypes from 'prop-types';
import { ipcRenderer } from 'electron';
import { connect } from 'react-redux';
import { notifyInfo } from '../../../state/ducks/notifyAndLog';

class StartPipelineListener extends React.Component {
  componentDidUpdate(prevProps) {
    if (this.hasNewMappedData(prevProps)) {
      this.startPipelineIfHasActiveRun();
    } else if (this.hasNewRemoteRun(prevProps)) {
      this.startRemoteRunsLocally();
    }
  }

  hasNewMappedData = (prevProps) => {
    const { maps } = this.props;

    return prevProps.maps.length < maps.length;
  }

  hasNewRemoteRun = (prevProps) => {
    const { remoteRuns } = this.props;

    return prevProps.remoteRuns.length < remoteRuns.length;
  }

  startPipelineIfHasActiveRun = () => {
    const {
      maps,
      consortia,
      remoteRuns,
    } = this.props;

    const lastDataMapping = maps[maps.length - 1];
    const consortium = consortia.find(c => lastDataMapping.consortiumId === c.id);

    const run = remoteRuns.find(run => run.consortiumId === consortium.id
      && !run.results && !run.error);

    if (run) {
      this.startPipeline(consortium, lastDataMapping, run);
    }
  }

  startRemoteRunsLocally = () => {
    const {
      remoteRuns,
      localRuns,
      localRunResults,
      consortia,
      maps,
      notifyInfo,
    } = this.props;

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

      this.startPipeline(consortium, dataMapping, remoteRun);
    });
  }

  startPipeline = (consortium, dataMapping, run) => {
    const { notifyInfo, networkVolume } = this.props;

    notifyInfo(`Pipeline Starting for ${consortium.name}.`);

    ipcRenderer.send('start-pipeline', {
      consortium, dataMappings: dataMapping, pipelineRun: run, networkVolume,
    });
  }

  render() {
    return null;
  }
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
