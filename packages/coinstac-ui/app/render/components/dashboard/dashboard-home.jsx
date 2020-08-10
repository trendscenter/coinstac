/* eslint-disable react/no-array-index-key */

import React from 'react';
import { ipcRenderer } from 'electron';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import RunsList from '../common/runs-list';

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

function DashboardHome(props) {
  const {
    consortia,
    runs,
    user,
    classes,
  } = props;

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
      />
    </div>
  );
}

DashboardHome.propTypes = {
  classes: PropTypes.object.isRequired,
  consortia: PropTypes.array.isRequired,
  runs: PropTypes.array.isRequired,
  user: PropTypes.object.isRequired,
};

function mapStateToProps({ auth: { user }, runs: { runs } }) {
  return { runs, user };
}

const connectedComponent = connect(mapStateToProps)(DashboardHome);

export default withStyles(styles)(connectedComponent);
