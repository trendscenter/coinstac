/* eslint-disable react/no-did-update-set-state */
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Link, withRouter } from 'react-router';
import { connect } from 'react-redux';
import { get } from 'lodash';
import { useLazyQuery } from '@apollo/client';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import LinearProgress from '@material-ui/core/LinearProgress';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import classnames from 'classnames';

import { FETCH_RUN_STATUS } from '../../../state/graphql/functions';

import useStyles from './top-notification-progress-bar.styles';

function runIsComplete(run) {
  return run.results || run.error;
}

function TopNotificationProgressBar({ runs, consortia, router }) {
  const classes = useStyles();

  const [runId, setRunId] = useState(null);
  const [consortiumName, setConsortiumName] = useState(null);
  const [pipelineName, setPipelineName] = useState(null);

  const [getRunStatus, { data }] = useLazyQuery(FETCH_RUN_STATUS, {
    pollInterval: runId ? 1000 : 0,
  });

  const runStatus = get(data, 'fetchRun.status', null);

  useEffect(() => {
    if (runId || !runs) return;

    const incompleteRun = runs.find(run => !runIsComplete(run) && run.status !== 'suspended');

    if (incompleteRun) {
      const consortium = consortia.find(c => c.id === incompleteRun.consortiumId);

      if (consortium) {
        setRunId(incompleteRun.id);
        setConsortiumName(consortium.name);
        setPipelineName(incompleteRun.pipelineSnapshot.name);

        getRunStatus({
          variables: { runId: incompleteRun.id },
        });
      }
    }
  }, [runs, consortia]);

  useEffect(() => {
    if (!runStatus) return;

    if (runStatus === 'complete' || runStatus === 'error') {
      setRunId(null);
      setConsortiumName(null);
      setPipelineName(null);
    }
  }, [runStatus]);

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

TopNotificationProgressBar.propTypes = {
  consortia: PropTypes.array,
  runs: PropTypes.array,
  router: PropTypes.object.isRequired,
};

TopNotificationProgressBar.defaultProps = {
  consortia: [],
  runs: [],
};

const mapStateToProps = ({ runs }) => ({
  runs: runs.runs,
});

export default connect(mapStateToProps)((withRouter(TopNotificationProgressBar)));
