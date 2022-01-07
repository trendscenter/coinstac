/* eslint-disable react/no-array-index-key */

import React from 'react';
import { ipcRenderer } from 'electron';
import ipcPromise from 'ipc-promise';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';

import RunsList from '../common/runs-list';
import { saveSuspendedRun, deleteSuspendedRun } from '../../state/ducks/suspendedRuns';
import { notifyInfo, notifyError } from '../../state/ducks/notifyAndLog';

const HOURS_SINCE_ACTIVE = 72;

const styles = theme => ({
  pageTitle: {
    marginBottom: theme.spacing(2),
  },
  pageSubtitle: {
    marginBottom: theme.spacing(2),
    marginTop: theme.spacing(2),
  },
});

const stopPipeline = (pipelineId, runId) => () => {
  ipcRenderer.send('stop-pipeline', { pipelineId, runId });
};

function DashboardHome({
  consortia, runs, maps, user, saveSuspendedRun, deleteSuspendedRun,
  networkVolume, classes, notifyError, notifyInfo,
}) {
  const suspendPipeline = runId => async () => {
    await ipcPromise.send('suspend-pipeline', { runId });
    saveSuspendedRun(runId);
  };

  const resumePipeline = run => () => {
    const consortium = consortia.find(c => c.id === run.consortiumId);
    if (!consortium) {
      notifyError('Consortium no longer exists for pipeline run.');
      return;
    }

    const dataMapping = maps.find(m => m.consortiumId === consortium.id
      && m.pipelineId === consortium.activePipelineId);
    if (!dataMapping) {
      notifyInfo(`Run for ${consortium.name} is waiting for your data. Please map your data to take part of the consortium.`);
      return;
    }

    deleteSuspendedRun(run.id);

    notifyInfo(`Pipeline Starting for ${consortium.name}.`);

    ipcRenderer.send('start-pipeline', {
      consortium, dataMappings: dataMapping, pipelineRun: run, networkVolume,
    });
  };

  return (
    <div>
      <Typography variant="h4" className={classes.pageTitle}>
        {`${user.username}'s Home`}
      </Typography>
      <Divider />
      <Typography variant="h6" className={classes.pageSubtitle}>
        {`Run Activity in the Last ${HOURS_SINCE_ACTIVE} Hours`}
      </Typography>
      <RunsList
        consortia={consortia}
        hoursSinceActive={HOURS_SINCE_ACTIVE}
        limitToComplete={false}
        runs={runs}
        stopPipeline={stopPipeline}
        suspendPipeline={suspendPipeline}
        resumePipeline={resumePipeline}
      />
    </div>
  );
}

DashboardHome.defaultProps = {
  consortia: [],
  runs: [],
};

DashboardHome.propTypes = {
  classes: PropTypes.object.isRequired,
  consortia: PropTypes.array,
  runs: PropTypes.array,
  maps: PropTypes.array.isRequired,
  user: PropTypes.object.isRequired,
  networkVolume: PropTypes.bool.isRequired,
  saveSuspendedRun: PropTypes.func.isRequired,
  deleteSuspendedRun: PropTypes.func.isRequired,
  notifyError: PropTypes.func.isRequired,
  notifyInfo: PropTypes.func.isRequired,
};

function mapStateToProps({
  auth: { user, networkVolume },
  runs: { runs },
  maps: { consortiumDataMappings },
}) {
  return {
    runs,
    user,
    maps: consortiumDataMappings,
    networkVolume,
  };
}

const connectedComponent = connect(mapStateToProps, {
  saveSuspendedRun,
  deleteSuspendedRun,
  notifyInfo,
  notifyError,
})(DashboardHome);

export default withStyles(styles)(connectedComponent);
