import React, { useEffect } from 'react';
import { ipcRenderer } from 'electron';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { get } from 'lodash';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import { withStyles } from '@material-ui/core/styles';
import { Button } from '@material-ui/core';
import { useLazyQuery } from '@apollo/client';
import ReactJson from 'react-json-view';
import { GET_PIPELINES_QUERY } from '../../state/graphql/functions';

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


  const [getPipelines, { data }] = useLazyQuery(GET_PIPELINES_QUERY, { fetchPolicy: 'network-only' });
  return (
    <div>
      <Typography variant="h4" className={classes.pageTitle}>
        Pipeline States
      </Typography>
      <Divider />
      <Button onClick={getPipelines} variant="contained">
        Get Pipeline States
      </Button>

      <ReactJson
        src={data && data.getPipelines && data.getPipelines.info
          && JSON.parse(data.getPipelines.info)}
        theme="monokai"
        displayDataTypes={false}
        displayObjectSize={false}
        enableClipboard={false}
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
