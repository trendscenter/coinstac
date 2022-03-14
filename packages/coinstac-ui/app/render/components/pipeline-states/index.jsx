import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { get } from 'lodash';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import { withStyles } from '@material-ui/core/styles';
import { Button, Card } from '@material-ui/core';
import { useLazyQuery, useMutation } from '@apollo/client';
import ReactJson from 'react-json-view';
import { GET_PIPELINES_QUERY, STOP_RUN_MUTATION } from '../../state/graphql/functions';

const styles = theme => ({
  pageTitle: {
    marginBottom: theme.spacing(2),
  },
  pipelineCard: {
    padding: '10px',
  },
  controlsCard: {
    padding: '10px',
  },
  jsonContainer: {
    paddingTop: '10px',
  },
});

const PipelineStates = (
  {
    classes, user,
  },
  { router }
) => {
  useEffect(() => {
    if (!get(user, 'permissions.roles.admin')) {
      router.push('/');
    }
  }, []);


  const [getPipelines, { data, loading }] = useLazyQuery(GET_PIPELINES_QUERY, { fetchPolicy: 'network-only' });
  const [stopRun] = useMutation(STOP_RUN_MUTATION);

  const pipelinesData = data
    && data.getPipelines
    && data.getPipelines.info
    ? JSON.parse(data.getPipelines.info) : {};

  const { activePipelines } = pipelinesData;


  return (
    <div>
      <Typography variant="h4" className={classes.pageTitle}>
        Pipeline States
      </Typography>
      <Divider />
      <Card className={classes.controlsCard}>
        <Button onClick={getPipelines} variant="contained">
          Get Pipeline States
        </Button>
        {loading && 'loading'}
      </Card>
      {activePipelines
        && Object.keys(activePipelines).map((pipelineId) => {
          return (
            <Card
              className={classes.pipelineCard}
              key={pipelineId}
            >
              <Typography variant="h5" className={classes.pageTitle}>
                {pipelineId}
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => { stopRun({ variables: { runId: pipelineId } }); }}
              >
                Stop Run
              </Button>
              <div
                className={classes.jsonContainer}
              >
                <ReactJson
                  src={activePipelines[pipelineId]}
                  theme="monokai"
                  displayDataTypes={false}
                  displayObjectSize={false}
                  enableClipboard={false}
                  collapsed
                />
              </div>
            </Card>
          );
        })
      }
    </div>
  );
};

PipelineStates.contextTypes = {
  router: PropTypes.object.isRequired,
};


PipelineStates.propTypes = {
  classes: PropTypes.object.isRequired,
  user: PropTypes.object.isRequired,
};

const mapStateToProps = ({ auth, runs }) => ({
  runs: runs.runs,
  user: auth.user,
});

const connectedComponent = connect(mapStateToProps)(PipelineStates);

export default withStyles(styles, { withTheme: true })(connectedComponent);
