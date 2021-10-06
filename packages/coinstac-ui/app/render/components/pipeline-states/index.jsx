import React, { useEffect } from 'react';
import { ipcRenderer } from 'electron';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { get } from 'lodash';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import { withStyles } from '@material-ui/core/styles';
import RunsList from './runs-list';

const styles = theme => ({
  pageTitle: {
    marginBottom: theme.spacing(2),
  },
});

const stopPipeline = (pipelineId, runId) => () => {
  ipcRenderer.send('stop-pipeline', { pipelineId, runId });
};

const PipelineStates = (
  {
    classes, user, consortia, runs,
  },
  { router }
) => {
  useEffect(() => {
    if (!get(user, 'permissions.roles.admin')) {
      router.push('/');
    }
  }, []);

  return (
    <div>
      <Typography variant="h4" className={classes.pageTitle}>
        Pipeline States
      </Typography>
      <Divider />
      <RunsList
        consortia={consortia}
        runs={runs}
        stopPipeline={stopPipeline}
      />
    </div>
  );
};

PipelineStates.contextTypes = {
  router: PropTypes.object.isRequired,
};

PipelineStates.defaultProps = {
  consortia: [],
  runs: [],
};

PipelineStates.propTypes = {
  classes: PropTypes.object.isRequired,
  consortia: PropTypes.array,
  runs: PropTypes.array,
  user: PropTypes.object.isRequired,
};

const mapStateToProps = ({ auth, runs }) => ({
  runs: runs.runs,
  user: auth.user,
});

const connectedComponent = connect(mapStateToProps)(PipelineStates);

export default withStyles(styles, { withTheme: true })(connectedComponent);
