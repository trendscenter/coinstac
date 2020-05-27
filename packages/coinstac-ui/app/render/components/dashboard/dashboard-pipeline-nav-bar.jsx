/* eslint-disable react/no-did-update-set-state */
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import LinearProgress from '@material-ui/core/LinearProgress';
import { withStyles } from '@material-ui/core/styles';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import classnames from 'classnames';

const styles = theme => ({
  root: {
    padding: theme.spacing(2),
    backgroundColor: '#F05A28',
    transition: 'all 0.5s ease-out',
  },
  titleBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
  },
  title: {
    color: '#f5f5f5',
  },
  hide: {
    maxHeight: 0,
    padding: 0,
  },
  show: {
    maxHeight: '300px',
  },
});

function runIsComplete(run) {
  return run.results || run.error;
}

class DashboardPipelineNavBar extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      runId: null,
      consortiumName: null,
      pipelineName: null,
    };
  }

  componentDidUpdate(prevProps) {
    const { localRuns, consortia } = this.props;
    const { runId } = this.state;

    const runs = localRuns || [];
    const prevRuns = prevProps.localRuns || [];

    if (prevRuns.length < runs.length) {
      const lastRun = runs.find(run => !runIsComplete(run));

      if (lastRun) {
        const consortium = consortia.find(c => c.id === lastRun.consortiumId);

        this.setState({
          runId: lastRun.id,
          consortiumName: consortium.name,
          pipelineName: lastRun.pipelineSnapshot.name,
        });
      }
    }

    if (runId) {
      const run = runs.find(r => r.id === runId);

      if (runIsComplete(run)) {
        this.setState({
          runId: null,
          consortiumName: null,
          pipelineName: null,
        });
      }
    }
  }

  render() {
    const { classes, router } = this.props;

    const { runId, consortiumName, pipelineName } = this.state;

    return (
      <div
        className={runId && router.location.pathname !== '/dashboard'
          ? classnames(classes.root, classes.show)
          : classnames(classes.root, classes.hide)
        }
      >
        <div className={classes.titleBox}>
          <Typography variant="h6" className={classes.title}>
            {`${consortiumName} | ${pipelineName}`}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            component={Link}
            to="/dashboard"
          >
            <KeyboardArrowUpIcon />
            View Detailed Progress
          </Button>
        </div>
        <LinearProgress variant="indeterminate" />
      </div>
    );
  }
}

DashboardPipelineNavBar.propTypes = {
  consortia: PropTypes.array.isRequired,
  localRuns: PropTypes.array.isRequired,
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(DashboardPipelineNavBar);
