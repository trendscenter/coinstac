import React from 'react';
import TimeStamp from 'react-timestamp';
import { Link } from 'react-router';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import LinearProgress from '@material-ui/core/LinearProgress';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import PropTypes from 'prop-types';

const styles = theme => ({
  rootPaper: {
    ...theme.mixins.gutters(),
    paddingTop: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 2,
    marginTop: theme.spacing.unit * 2,
  },
  titleContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.unit,
  },
  label: {
    display: 'inline-block',
    fontWeight: 'bold',
    marginRight: theme.spacing.unit,
  },
  value: {
    display: 'inline-block',
  },
  contentContainer: {
    marginBottom: theme.spacing.unit,
  },
  actionButtons: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  runStateContainer: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  runStatePaper: {
    width: `calc(50% - ${theme.spacing.unit}px)`,
  },
  runTitle: {
    textDecoration: 'underline',
    marginBottom: theme.spacing.unit,
  },
});

function getStateWell(runObject, stateName, stateKey, classes) {
  return (
    <Paper
      className={classNames(classes.rootPaper, classes.runStatePaper)}
    >
      <Typography variant="headline" className={classes.runTitle}>
        {`${stateName} Pipeline State:`}
      </Typography>
      {
        runObject[stateKey].mode
        && (
          <div>
            <Typography className={classes.label}>Mode:</Typography>
            <Typography className={classes.value}>
              {runObject[stateKey].mode}
            </Typography>
          </div>
        )
      }
      {
        runObject[stateKey].waitingOn
        && (
          <div>
            <Typography className={classes.label}>Waiting on Users:</Typography>
            <Typography className={classes.value}>
              {runObject[stateKey].controllerState.includes('waiting on') ? runObject[stateKey].waitingOn.join(', ') : ''}
            </Typography>
          </div>
        )
      }
      {
        runObject[stateKey].controllerState
        && (
          <div>
            <Typography className={classes.label}>Controller State:</Typography>
            <Typography className={classes.value}>
              {runObject[stateKey].controllerState}
            </Typography>
          </div>
        )
      }
      {
        runObject[stateKey].currentIteration >= 0
        && (
          <div>
            <Typography className={classes.label}>Current Iteration:</Typography>
            <Typography className={classes.value}>
              {runObject[stateKey].currentIteration}
            </Typography>
          </div>
        )
      }
      {
        runObject[stateKey].pipelineStep >= 0
        && (
          <div>
            <Typography className={classes.label}>Step Count:</Typography>
            <Typography className={classes.value}>
              {`${runObject[stateKey].pipelineStep + 1} / ${runObject[stateKey].totalSteps}`}
            </Typography>
          </div>
        )
      }
    </Paper>
  );
}

const RunItem = ({ consortiumName, runObject, classes }) => (
  <Paper
    key={runObject.id}
    elevation={4}
    className={classes.rootPaper}
  >
    <div className={classes.titleContainer}>
      <Typography variant="headline">
        { consortiumName }
        {
          runObject.pipelineSnapshot
          && <span>{ ` || ${runObject.pipelineSnapshot.name}`}</span>
        }
      </Typography>
      {
        !runObject.endDate
        && (
          <Typography variant="headline">
            {'Started: '}
            <TimeStamp
              time={runObject.startDate / 1000}
              precision={2}
              autoUpdate={60}
              format="ago"
            />
          </Typography>
        )
      }
      {
        runObject.endDate
        && (
          <Typography variant="headline">
            {'Completed: '}
            <TimeStamp
              time={runObject.endDate / 1000}
              precision={2}
              autoUpdate={60}
              format="ago"
            />
          </Typography>
        )
      }
    </div>
    <div className={classes.contentContainer}>
      {
        runObject.status === 'started' && (runObject.localPipelineState || runObject.remotePipelineState)
        && (
          <LinearProgress
            variant="determinate"
            value={runObject.remotePipelineState
              ? ((runObject.remotePipelineState.pipelineStep + 1) / runObject.remotePipelineState.totalSteps) * 100
              : ((runObject.localPipelineState.pipelineStep + 1) / runObject.localPipelineState.totalSteps) * 100
            }
          />
        )
      }
      <div>
        <Typography className={classes.label}>
          Status:
        </Typography>
        <Typography className={classes.value}>
          {runObject.status === 'complete' && <span style={{ color: 'green' }}>Complete</span>}
          {runObject.status === 'started' && <span style={{ color: 'cornflowerblue' }}>In Progress</span>}
          {runObject.status === 'error' && <span style={{ color: 'red' }}>Error</span>}
        </Typography>
        {
          runObject.status === 'needs-map'
          && (
            <Button
              variant="contained"
              component={Link}
              href="/dashboard/collections"
            >
              Map Now
            </Button>
          )
        }
      </div>
      {
        runObject.startDate
        && (
          <div>
            <Typography className={classes.label}>
              Start date:
            </Typography>
            <Typography className={classes.value}>
              <TimeStamp
                time={runObject.startDate / 1000}
                precision={2}
                autoUpdate={10}
                format="full"
              />
            </Typography>
          </div>
        )
      }
      {
        runObject.endDate
        && (
          <div>
            <Typography className={classes.label}>
              End date:
            </Typography>
            <Typography className={classes.value}>
              <TimeStamp
                time={runObject.endDate / 1000}
                precision={2}
                autoUpdate={10}
                format="full"
              />
            </Typography>
          </div>
        )
      }
      {
        runObject.clients
        && (
          <div>
            <Typography className={classes.label}>
              Clients:
            </Typography>
            <Typography className={classes.value}>
              { runObject.clients.join(', ') }
            </Typography>
          </div>
        )
      }
      <div className={classes.runStateContainer}>
        {
          runObject.localPipelineState && runObject.status === 'started'
          && getStateWell(runObject, 'Local', 'localPipelineState', classes)
        }
        {
          runObject.remotePipelineState && runObject.status === 'started'
          && getStateWell(runObject, 'Remote', 'remotePipelineState', classes)
        }
      </div>
    </div>
    <div className={classes.actionButtons}>
      {
        runObject.results
        && (
          <Button
            variant="contained"
            color="primary"
            component={Link}
            to={`/dashboard/results/${runObject.id}`}
          >
            View Results
          </Button>
        )
      }
      {
        runObject.error
        && (
          <Button
            variant="contained"
            component={Link}
            to={`/dashboard/results/${runObject.id}`}
          >
            View Error
          </Button>
        )
      }
      {
        runObject.pipelineSnapshot
        && (
          <Button
            variant="contained"
            color="secondary"
            component={Link}
            to={`/dashboard/pipelines/snapShot/${runObject.pipelineSnapshot.id}`}
          >
            View Pipeline
          </Button>
        )
      }
    </div>
  </Paper>
);

RunItem.propTypes = {
  consortiumName: PropTypes.string.isRequired,
  runObject: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(RunItem);
