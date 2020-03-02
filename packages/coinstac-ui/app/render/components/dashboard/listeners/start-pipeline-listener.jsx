import React from 'react';
import PropTypes from 'prop-types';
import { ipcRenderer, remote } from 'electron';
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
    } = this.props;

    const lastDataMapping = maps[maps.length - 1];
    const consortium = consortia.find(c => lastDataMapping.consortiumId === c.id);

    const run = this.getConsortiumActiveRun(consortium);
    if (run) {
      this.startPipeline(consortium, lastDataMapping, run);
    }
  }

  startRemoteRunsLocally = () => {
    const {
      remoteRuns,
      localRuns,
      consortia,
      maps,
    } = this.props;

    remoteRuns.forEach((remoteRun) => {
      if (localRuns.findIndex(run => run.id === remoteRun.id) > -1) {
        return;
      }

      if (remoteRun.results || remoteRun.error) {
        return;
      }

      const consortium = consortia.find(c => c.id === remoteRun.consortiumId);
      const dataMapping = maps.find(m => m.consortiumId === consortium.id
        && m.pipelineId === consortium.activePipelineId);


      this.startPipeline(consortium, dataMapping, remoteRun);
    });
  }

  getConsortiumActiveRun = (consortium) => {
    const { remoteRuns, auth: { user } } = this.props;

    if (!remoteRuns || !remoteRuns.length) {
      return false;
    }

    return remoteRuns.find(run => run.consortiumId === consortium.id
      && run.clients.includes(user.id) && !run.results && !run.error);
  }

  startPipeline = (consortium, dataMapping, run) => {
    const { notifyInfo, router } = this.props;

    notifyInfo({
      message: `Pipeline Starting for ${consortium.name}.`,
      action: {
        label: 'Watch Progress',
        callback: () => {
          router.push('dashboard');
        },
      },
    });

    console.log('testao', {
      consortium, dataMappings: dataMapping, pipelineRun: run,
    });

    ipcRenderer.send('start-pipeline', {
      consortium, dataMappings: dataMapping, pipelineRun: run,
    });
  }

  render() {
    return null;
  }
}

StartPipelineListener.propTypes = {
  maps: PropTypes.array.isRequired,
  consortia: PropTypes.array.isRequired,
  remoteRuns: PropTypes.array.isRequired,
  localRuns: PropTypes.array.isRequired,
  auth: PropTypes.object.isRequired,
  notifyInfo: PropTypes.func.isRequired,
  router: PropTypes.object.isRequired,
};

function mapStateToProps({ auth, runs: { runs }, maps }) {
  return {
    auth,
    localRuns: runs,
    maps: maps.consortiumDataMappings,
  };
}

export default connect(mapStateToProps,
  {
    notifyInfo,
  })(StartPipelineListener);
