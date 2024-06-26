import { useLazyQuery, useMutation } from '@apollo/client';
import { Button, Card } from '@material-ui/core';
import makeStyles from '@material-ui/core/styles/makeStyles';
import Typography from '@material-ui/core/Typography';
import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import ReactJson from 'react-json-view';
import { useSelector } from 'react-redux';

import { GET_PIPELINES_QUERY, STOP_RUN_MUTATION } from '../../state/graphql/functions';

const useStyles = makeStyles(() => ({
  pipelineCard: {
    padding: 10,
  },
  controlsCard: {
    padding: 10,
  },
  jsonContainer: {
    paddingTop: 10,
  },
}));

const PipelineStates = (_, { router }) => {
  const user = useSelector(state => state.auth.user);

  const classes = useStyles();

  useEffect(() => {
    if (!get(user, 'permissions.roles.admin')) {
      router.push('/');
    }
  }, []);

  const [getPipelines, { data, loading }] = useLazyQuery(GET_PIPELINES_QUERY, { fetchPolicy: 'network-only' });
  const [stopRun] = useMutation(STOP_RUN_MUTATION);

  const pipelinesData = data?.getPipelines?.info ? JSON.parse(data.getPipelines.info) : {};

  const { activePipelines } = pipelinesData;

  return (
    <>
      <Card className={classes.controlsCard}>
        <Button onClick={getPipelines} variant="contained">
          Get Pipeline States
        </Button>
        {loading && 'loading'}
      </Card>
      {activePipelines && Object.keys(activePipelines).map(pipelineId => (
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
      ))}
    </>
  );
};

PipelineStates.contextTypes = {
  router: PropTypes.object.isRequired,
};

export default PipelineStates;
