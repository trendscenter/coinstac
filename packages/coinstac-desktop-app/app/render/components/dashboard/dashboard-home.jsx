/* eslint-disable react/no-array-index-key */

import React from 'react';
import { ipcRenderer } from 'electron';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import makeStyles from '@material-ui/core/styles/makeStyles';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';

import RunsList from '../common/runs-list';
import { saveSuspendedRun, deleteSuspendedRun } from '../../state/ducks/suspendedRuns';
import { notifyInfo, notifyError } from '../../state/ducks/notifyAndLog';
import useSelectRunsOfInterest from '../runs/effects/useSelectRunsOfInterest';
import DashboardDocs from './dashboard-docs';

const HOURS_SINCE_ACTIVE = 72;

const useStyles = makeStyles(theme => ({
  pageTitle: {
    marginBottom: theme.spacing(2),
  },
  pageSubtitle: {
    marginBottom: theme.spacing(2),
    marginTop: theme.spacing(2),
  },
}));

const stopPipeline = (pipelineId, runId) => () => {
  ipcRenderer.send('stop-pipeline', { pipelineId, runId });
};

function DashboardHome({
  consortia,
}) {
  const maps = useSelector(state => state.maps.consortiumDataMappings);
  const user = useSelector(state => state.auth.user);
  const networkVolume = useSelector(state => state.auth.networkVolume);
  const suspendedRuns = useSelector(state => state.suspendedRuns);

  const dispatch = useDispatch();

  const classes = useStyles();

  const filteredRuns = useSelectRunsOfInterest(HOURS_SINCE_ACTIVE);

  const suspendPipeline = runId => async () => {
    const runSaveState = await ipcRenderer.invoke('suspend-pipeline', { runId });
    dispatch(saveSuspendedRun(runId, runSaveState));
  };

  const resumePipeline = run => () => {
    const consortium = consortia.find(c => c.id === run.consortiumId);
    if (!consortium) {
      dispatch(notifyError('Consortium no longer exists for pipeline run.'));
      return;
    }

    const dataMapping = maps.find(m => m.consortiumId === consortium.id
      && m.pipelineId === consortium.activePipelineId);
    if (!dataMapping) {
      dispatch(
        notifyInfo(`Run for ${consortium.name} is waiting for your data. Please map your data to take part of the consortium.`)
      );
      return;
    }

    const runState = suspendedRuns[run.id];

    dispatch(deleteSuspendedRun(run.id));

    dispatch(notifyInfo(`Pipeline Starting for ${consortium.name}.`));

    ipcRenderer.send('start-pipeline', {
      consortium, dataMappings: dataMapping, pipelineRun: run, networkVolume, runState,
    });
  };

  return (
    <div>
      <div className="page-header">
        <Typography variant="h4" className={classes.pageTitle}>
          {`${user.username}'s Home`}
        </Typography>
      </div>
      <Divider />
      <Typography variant="h6" className={classes.pageSubtitle}>
        {`Run Activity in the Last ${HOURS_SINCE_ACTIVE} Hours`}
      </Typography>
      <RunsList
        runs={filteredRuns}
        consortia={consortia}
        noRunMessage={`No activity in the last ${HOURS_SINCE_ACTIVE} hours`}
        stopPipeline={stopPipeline}
        suspendPipeline={suspendPipeline}
        resumePipeline={resumePipeline}
      />
      <DashboardDocs />
    </div>
  );
}

DashboardHome.defaultProps = {
  consortia: [],
};

DashboardHome.propTypes = {
  consortia: PropTypes.array,
};

export default DashboardHome;
