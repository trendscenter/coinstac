import React, { Component } from 'react';
import { Link } from 'react-router';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { shell } from 'electron';
import map from 'lodash/map';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import LinearProgress from '@material-ui/core/LinearProgress';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import path from 'path';
import moment from 'moment';
import StatusButtonWrapper from './status-button-wrapper';
import TimeAgo from './time-ago';

const styles = theme => ({
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
    minHeight: '8em',
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
});

function parseWaiting(runObject, stateKey) {
  return map(runObject[stateKey].waitingOn, clientId => runObject.clients[clientId])
    .filter(clientId => Boolean(clientId));
}

function getStateWell(runObject, classes) {
  const OuterNodeRunObject = runObject.localPipelineState;
  const CentralNodeRunObject = runObject.remotePipelineState;


  return (
    <div className={classes.runStateInnerContainer}>

      <div>
        <Typography className={classes.label}>Pipeline Step</Typography>
        <Typography className={classes.value}>
          {`${OuterNodeRunObject.pipelineStep + 1} out of ${OuterNodeRunObject.totalSteps}`}
        </Typography>
      </div>

      <div>
        <Typography className={classes.label}>Iteration:</Typography>
        <Typography className={classes.value}>
          {OuterNodeRunObject.currentIteration}
        </Typography>
      </div>

      <div>
        <Typography className={classes.label}>Local Node Status:</Typography>
        <Typography className={classes.value}>
          {OuterNodeRunObject.controllerState}
        </Typography>
      </div>

      <div>
        <Typography className={classes.label}>Central Node Status:</Typography>
        <Typography className={classes.value}>
          {CentralNodeRunObject.controllerState}
        </Typography>
      </div>
      {
        CentralNodeRunObject.waitingOn && CentralNodeRunObject.waitingOn.length > 0
        && (
          <div>
            <Typography className={classes.label}>Waiting on Users:</Typography>
            <Typography className={classes.value}>
              {CentralNodeRunObject.controllerState.includes('waiting on') ? parseWaiting(runObject, 'remotePipelineState') : ''}
            </Typography>
          </div>
        )
      }
    </div>
  );
}

class RunItem extends Component {
  handleStopPipeline = () => {
    const { stopPipeline } = this.props;
    stopPipeline();
  }

  handleOpenResult = () => {
    const { runObject, appDirectory, user } = this.props;
    const resultDir = path.join(appDirectory, 'output', user.id, runObject.id);

    shell.openPath(resultDir);
  }

  render() {
    const { consortiumName, runObject, classes } = this.props;
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
            {consortiumName}
            {
              pipelineSnapshot
              && <span>{` || ${pipelineSnapshot.name}`}</span>
            }
          </Typography>
          {
            !endDate && status === 'started'
            && (
              <Typography variant="h5">
                {'Started: '}
                <TimeAgo timestamp={runObject.startDate / 1000} />
              </Typography>
            )
          }
          {
            endDate
            && (
              <Typography variant="h5">
                {'Completed: '}
                <TimeAgo timestamp={runObject.endDate / 1000} />
              </Typography>
            )
          }
        </div>
        <div className={classes.contentContainer}>
          {
            status === 'started' && (localPipelineState || remotePipelineState)
            && (
              <LinearProgress
                variant="indeterminate"
                value={remotePipelineState
                  ? ((remotePipelineState.pipelineStep + 1) / remotePipelineState.totalSteps) * 100
                  : ((localPipelineState.pipelineStep + 1) / localPipelineState.totalSteps) * 100
                }
              />
            )
          }
          <div>
            <Typography className={classes.label}>
              Status:
            </Typography>
            <Typography className={classes.value}>
              {status === 'complete' && <span style={{ color: 'green' }}>Complete</span>}
              {status === 'started' && <span style={{ color: 'cornflowerblue' }}>In Progress</span>}
              {status === 'error' && <span style={{ color: 'red' }}>Error</span>}
            </Typography>
            {
              status === 'needs-map'
              && (
                <Button
                  variant="contained"
                  component={Link}
                  href="/dashboard/maps"
                >
                  Map Now
                </Button>
              )
            }
          </div>
          {
            startDate
            && (
              <div>
                <Typography className={classes.label}>
                  Start date:
                </Typography>
                <Typography className={classes.value}>
                  {moment.unix(runObject.startDate / 1000).format('MMMM Do YYYY, h:mm:ss a')}
                </Typography>
              </div>
            )
          }
          {
            endDate
            && (
              <div>
                <Typography className={classes.label}>
                  End date:
                </Typography>
                <Typography className={classes.value}>
                  {moment.unix(runObject.endDate / 1000).format('MMMM Do YYYY, h:mm:ss a')}
                </Typography>
              </div>
            )
          }
          {
            clients
            && (
              <div>
                <Typography className={classes.label}>
                  Clients:
                </Typography>
                <Typography className={classes.value}>
                  {Object.values(clients).join(', ')}
                </Typography>
              </div>
            )
          }
          <div className={classes.runStateContainer}>
            {
              localPipelineState && status === 'started'
              && getStateWell(runObject, classes)
            }
          </div>
        </div>
        <div className={classes.actionButtons}>
          {
            results
            && (
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
                  onClick={this.handleOpenResult}
                >
                  Open Results
                </Button>
              </div>
            )
          }
          {
            error
            && (
              <Button
                variant="contained"
                component={Link}
                to={`/dashboard/results/${id}`}
                className={classes.button}
              >
                View Error
              </Button>
            )
          }
          {
            pipelineSnapshot
            && (
              <Button
                variant="contained"
                color="secondary"
                component={Link}
                to={`/dashboard/pipelines/snapShot/${pipelineSnapshot.id}`}
                className={classes.pipelineButton}
              >
                View Pipeline
              </Button>
            )
          }
          {
            status === 'started' && (localPipelineState || remotePipelineState)
            && (
              <StatusButtonWrapper>
                <Button
                  variant="contained"
                  component={Link}
                  className={classes.button}
                  onClick={this.handleStopPipeline}
                >
                  Stop Pipeline
                </Button>
              </StatusButtonWrapper>
            )
          }
        </div>
      </Paper>
    );
  }
}

RunItem.defaultProps = {
  stopPipeline: () => { },
};

RunItem.propTypes = {
  appDirectory: PropTypes.string.isRequired,
  classes: PropTypes.object.isRequired,
  consortiumName: PropTypes.string.isRequired,
  runObject: PropTypes.object.isRequired,
  user: PropTypes.object.isRequired,
  stopPipeline: PropTypes.func,
};

const mapStateToProps = ({ auth }) => ({
  appDirectory: auth.appDirectory,
  user: auth.user,
});

export default compose(
  withStyles(styles),
  connect(mapStateToProps)
)(RunItem);
