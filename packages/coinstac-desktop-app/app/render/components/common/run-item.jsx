import React, { useMemo, useState } from 'react';
import { useMutation } from '@apollo/client';
import { Link } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { shell } from 'electron';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import LinearProgress from '@material-ui/core/LinearProgress';
import makeStyles from '@material-ui/core/styles/makeStyles';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import path from 'path';
import moment from 'moment';

import StatusButtonWrapper from './status-button-wrapper';
import TimeAgo from './time-ago';
import { DELETE_RUN_MUTATION } from '../../state/graphql/functions';
import { deleteRun } from '../../state/ducks/runs';
import ListDeleteModal from './list-delete-modal';
import { isUserInGroup } from '../../utils/helpers';

const useStyles = makeStyles(theme => ({
  rootPaper: {
    padding: theme.spacing(2),
    marginTop: theme.spacing(2),
    [theme.breakpoints.up('sm')]: {
      paddingLeft: theme.spacing(3),
      paddingRight: theme.spacing(3),
    },
  },
  titleContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(1),
  },
  label: {
    display: 'inline-block',
    fontWeight: 'bold',
    marginRight: theme.spacing(1),
  },
  value: {
    display: 'inline-block',
    whiteSpace: 'nowrap',
  },
  contentContainer: {
    marginBottom: theme.spacing(1),
  },
  actionButtons: {
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  resultButtons: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  runStateContainer: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  runStateInnerContainer: {
    paddingBottom: '1em',
  },
  runStateKeyValueContainer: {
    whiteSpace: 'nowrap',
  },
  runTitle: {
    textDecoration: 'underline',
    marginBottom: theme.spacing(1),
  },
  button: {
    marginTop: theme.spacing(1),
    marginRight: theme.spacing(1),
  },
  pipelineButton: {
    marginTop: theme.spacing(1),
  },
}));

function getStateWell(runObject, classes) {
  const OuterNodeRunObject = runObject.localPipelineState;
  const CentralNodeRunObject = runObject.remotePipelineState;

  return (
    <div className={classes.runStateInnerContainer}>
      {OuterNodeRunObject && (
        <>
          <div className={classes.runStateKeyValueContainer}>
            <Typography className={classes.label}>Iteration:</Typography>
            <Typography className={classes.value}>
              {OuterNodeRunObject.currentIteration}
            </Typography>
          </div>

          <div className={classes.runStateKeyValueContainer}>
            <Typography className={classes.label}>Your Pipeline Status:</Typography>
            <Typography className={classes.value}>
              {OuterNodeRunObject.controllerState}
            </Typography>
          </div>
        </>
      )}
      {CentralNodeRunObject && (
        <div className={classes.runStateKeyValueContainer}>
          <Typography className={classes.label}>Coinstac Central Server Status:</Typography>
          <Typography className={classes.value}>
            {CentralNodeRunObject.controllerState}
          </Typography>
        </div>
      )}
      {CentralNodeRunObject
        && CentralNodeRunObject.controllerState
        && CentralNodeRunObject.waitingOn
        && (
          <div className={classes.runStateKeyValueContainer}>
            <Typography className={classes.label}>Waiting on Users:</Typography>
            <Typography className={classes.value}>
              {CentralNodeRunObject.waitingOn}
            </Typography>
          </div>
        )}
    </div>
  );
}

function RunItem({
  consortium,
  runObject,
  stopPipeline,
  suspendPipeline,
  resumePipeline,
}) {
  const appDirectory = useSelector(state => state.auth.appDirectory);
  const user = useSelector(state => state.auth.user);

  const dispatch = useDispatch();

  const classes = useStyles();

  const [deleteRunMutation] = useMutation(DELETE_RUN_MUTATION);
  const [showModal, setShowModal] = useState(false);

  const isOwner = useMemo(() => {
    return isUserInGroup(user.id, consortium.owners);
  }, [user, consortium]);

  const handleStopPipeline = () => {
    stopPipeline();
  };

  const handleSuspendPipeline = () => {
    suspendPipeline();
  };

  const handleResumePipeline = () => {
    resumePipeline();
  };

  const handleOpenResult = () => {
    const resultDir = path.join(appDirectory, 'output', user.id, runObject.id);

    shell.openPath(resultDir);
  };

  const handleDeleteRun = () => {
    if (runObject.type === 'decentralized') {
      return deleteRunMutation({ variables: { runId: runObject.id } });
    }

    dispatch(deleteRun(runObject.id));
  };

  const {
    id, startDate, endDate, status, localPipelineState, remotePipelineState,
    clients, pipelineSnapshot, results, error,
  } = runObject;

  return (
    <Paper
      key={id}
      elevation={4}
      className={classNames(classes.rootPaper, 'run-item-paper')}
    >
      <div className={classes.titleContainer}>
        <Typography variant="h5">
          {consortium.name}
          {pipelineSnapshot && <span>{` | ${pipelineSnapshot.name}`}</span>}
        </Typography>
        {!endDate && status === 'started' && (
          <Typography variant="h5">
            {'Started: '}
            <TimeAgo timestamp={runObject.startDate / 1000} />
          </Typography>
        )}
        {endDate && (
          <Typography variant="h5">
            {'Completed: '}
            <TimeAgo timestamp={runObject.endDate / 1000} />
          </Typography>
        )}
      </div>
      <div className={classes.contentContainer}>
        {status === 'started' && (localPipelineState || remotePipelineState) && (
          <LinearProgress
            variant="indeterminate"
            value={remotePipelineState
              ? ((remotePipelineState.pipelineStep + 1) / remotePipelineState.totalSteps) * 100
              : ((localPipelineState.pipelineStep + 1) / localPipelineState.totalSteps) * 100
            }
          />
        )}
        <div>
          <Typography
            className={classes.label}
            style={{ paddingTop: '30px' }}
          >
            Status:
          </Typography>
          <Typography className={classes.value}>
            {status === 'complete' && <span style={{ color: 'green' }}>Complete</span>}
            {status === 'started' && <span style={{ color: 'cornflowerblue' }}>In Progress</span>}
            {status === 'suspended' && <span style={{ color: 'cornflowerblue' }}>Suspended</span>}
            {status === 'error' && <span style={{ color: 'red' }}>Error</span>}
          </Typography>
          {status === 'needs-map' && (
            <Button
              variant="contained"
              component={Link}
              href="/dashboard/maps"
            >
              Map Now
            </Button>
          )}
        </div>
        {startDate && (
          <div>
            <Typography className={classes.label}>
              Start date:
            </Typography>
            <Typography className={classes.value}>
              {moment.unix(runObject.startDate / 1000).format('MMMM Do YYYY, h:mm:ss a')}
            </Typography>
          </div>
        )}
        {endDate && (
          <div>
            <Typography className={classes.label}>
              End date:
            </Typography>
            <Typography className={classes.value}>
              {moment.unix(runObject.endDate / 1000).format('MMMM Do YYYY, h:mm:ss a')}
            </Typography>
          </div>
        )}
        {clients && (
          <div>
            <Typography className={classes.label}>
              Users:
            </Typography>
            <Typography className={classes.value}>
              {Object.values(clients).join(', ')}
            </Typography>
          </div>
        )}
        <div className={classes.runStateContainer}>
          {(localPipelineState || remotePipelineState) && status === 'started'
            && getStateWell(runObject, classes)}
        </div>
      </div>
      <div className={classes.actionButtons}>
        {results && (
          <div className={classes.resultButtons}>
            <Button
              variant="contained"
              color="primary"
              component={Link}
              to={`/dashboard/results/${id}`}
              className={classes.button}
            >
              View Results
            </Button>
            <Button
              variant="contained"
              color="primary"
              className={classes.button}
              onClick={handleOpenResult}
            >
              Open Results
            </Button>
          </div>
        )}
        {error && (
          <Button
            variant="contained"
            component={Link}
            to={`/dashboard/results/${id}`}
            className={classes.button}
          >
            View Error
          </Button>
        )}
        {pipelineSnapshot && (
          <Button
            variant="contained"
            color="secondary"
            component={Link}
            to={`/dashboard/pipelines/snapShot/${pipelineSnapshot.id}`}
            className={classes.pipelineButton}
          >
            View Pipeline
          </Button>
        )}
        {status === 'started' && (localPipelineState || remotePipelineState) && (
          <>
            {isOwner && (
              <StatusButtonWrapper>
                <Button
                  variant="contained"
                  component={Link}
                  className={classes.button}
                  onClick={handleStopPipeline}
                >
                  Stop Pipeline
                </Button>
              </StatusButtonWrapper>
            )}
            <Button
              variant="contained"
              component={Link}
              className={classes.button}
              onClick={handleSuspendPipeline}
            >
              Suspend Pipeline
            </Button>
          </>
        )}
        {status === 'suspended' && (
          <Button
            variant="contained"
            component={Link}
            className={classes.button}
            onClick={handleResumePipeline}
          >
            Resume Pipeline
          </Button>
        )}
        <Button
          variant="contained"
          component={Link}
          className={classes.button}
          onClick={() => { setShowModal(true); }}
        >
          Delete Run
        </Button>
        <ListDeleteModal
          close={() => { setShowModal(false); }}
          deleteItem={handleDeleteRun}
          itemName="run"
          show={showModal}
        />
      </div>
    </Paper>
  );
}


RunItem.defaultProps = {
  stopPipeline: () => { },
  suspendPipeline: () => { },
  resumePipeline: () => { },
};

RunItem.propTypes = {
  consortium: PropTypes.object.isRequired,
  runObject: PropTypes.object.isRequired,
  stopPipeline: PropTypes.func,
  suspendPipeline: PropTypes.func,
  resumePipeline: PropTypes.func,
};

export default RunItem;
