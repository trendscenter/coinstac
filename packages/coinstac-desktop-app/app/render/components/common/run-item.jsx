import { useMutation } from '@apollo/client';
import { graphql, withApollo } from '@apollo/react-hoc';
import { Link } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { shell } from 'electron';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import LinearProgress from '@material-ui/core/LinearProgress';
import makeStyles from '@material-ui/core/styles/makeStyles';
import Typography from '@material-ui/core/Typography';
import classNames from 'classnames';
import { shell } from 'electron';
import PropTypes from 'prop-types';
import path from 'path';
import { flowRight as compose } from 'lodash';
import moment from 'moment';
import path from 'path';
import PropTypes from 'prop-types';
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router';

import { deleteRun } from '../../state/ducks/runs';
import { DELETE_RUN_MUTATION } from '../../state/graphql/functions';
import { isUserInGroup } from '../../utils/helpers';
import ListDeleteModal from './list-delete-modal';
import StatusButtonWrapper from './status-button-wrapper';
import TimeAgo from './time-ago';
import {
  DELETE_RUN_MUTATION,
  FETCH_ALL_USERS_QUERY,
  USER_CHANGED_SUBSCRIPTION,
} from '../../state/graphql/functions';
import { deleteRun } from '../../state/ducks/runs';
import ListDeleteModal from './list-delete-modal';
import { isUserInGroup } from '../../utils/helpers';
import { getAllAndSubProp } from '../../state/graphql/props';

const fs = require('fs');

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

function getStateWell(runObject, users, classes) {
  const OuterNodeRunObject = runObject.localPipelineState;
  const CentralNodeRunObject = runObject.remotePipelineState;

  const getUserNames = () => {
    if (!CentralNodeRunObject.waitingOn) {
      return '';
    }

    return users.map(user => user.username)
      .filter(username => CentralNodeRunObject.waitingOn.includes(username))
      .join(',');
  };

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
              {getUserNames()}
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
  users,
}) {
  const appDirectory = useSelector(state => state.auth.appDirectory);
  const user = useSelector(state => state.auth.user);

  const dispatch = useDispatch();

  const classes = useStyles();

  const [deleteRunMutation] = useMutation(DELETE_RUN_MUTATION);
  const [showModal, setShowModal] = useState(false);
  const [logURL, setLogURL] = useState(false);

  const isOwner = useMemo(() => isUserInGroup(user.id, consortium.owners), [user, consortium]);

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

  const handleLinkClick = (url) => {
    shell.openExternal(url);
  };

  useEffect(() => {
    const timerFunc = setTimeout(() => {
      if (runObject && appDirectory && !logURL) {
        const resultDir = path.join(appDirectory, 'output', user.id, runObject.id);
        const file = `${resultDir}/local.log`;

        try {
          const dirContents = fs.readdirSync(resultDir);
          const check = dirContents.includes('local.log');
          if (check) {
            try {
              const text = fs.readFileSync(file, { encoding: 'utf8', flag: 'r' });
              const lines = text.split(/\r?\n/);
              let found = lines.find(line => line.includes('Wandb URL: '));
              found = found.split(': ');
              const url = found[1];
              setLogURL(url);
            } catch (e) { } // eslint-disable-line no-empty
          }
        } catch (e) { } // eslint-disable-line no-empty
      }
    }, 3000);

    if (logURL) {
      clearTimeout(timerFunc);
    }
  });

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
        {
          logURL && typeof logURL === 'string'
          && (
            <div>
              <Typography className={classes.label}>
                WanDB Log URL:
              </Typography>
              <Typography className={classes.value}>
                <a
                  href={logURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleLinkClick(logURL)}
                >
                  {logURL}
                </a>
              </Typography>
            </div>
          )
        }
        <div className={classes.runStateContainer}>
          {(localPipelineState || remotePipelineState) && status === 'started'
            && getStateWell(runObject, users, classes)}
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
  users: [],
};

RunItem.propTypes = {
  consortium: PropTypes.object.isRequired,
  runObject: PropTypes.object.isRequired,
  stopPipeline: PropTypes.func,
  suspendPipeline: PropTypes.func,
  resumePipeline: PropTypes.func,
  users: PropTypes.array,
};

const RunItemWithUsers = compose(
  graphql(FETCH_ALL_USERS_QUERY, getAllAndSubProp(
    USER_CHANGED_SUBSCRIPTION,
    'users',
    'fetchAllUsers',
    'subscribeToUsers',
    'userChanged'
  )),
  withApollo
)(RunItem);

export default RunItemWithUsers;
