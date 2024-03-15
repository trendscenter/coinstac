import { graphql } from '@apollo/react-hoc';
import Box from '@material-ui/core/Box';
import Fab from '@material-ui/core/Fab';
import { makeStyles } from '@material-ui/core/styles';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import Typography from '@material-ui/core/Typography';
import AddIcon from '@material-ui/icons/Add';
import PropTypes from 'prop-types';
import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router';

import { notifyError } from '../../state/ducks/notifyAndLog';
import {
  DELETE_PIPELINE_MUTATION,
  FETCH_ALL_PIPELINES_QUERY,
} from '../../state/graphql/functions';
import {
  removeDocFromTableProp,
} from '../../state/graphql/props';
import { hasPipelineAccess, isPipelineOwner } from '../../utils/helpers';
import ListDeleteModal from '../common/list-delete-modal';
import ListItem from '../common/list-item';

const useStyles = makeStyles(theme => ({
  button: {
    margin: theme.spacing(1),
  },
}));

const PipelinesList = ({ pipelines, deletePipeline }) => {
  const [pipelineToDelete, setPipelineToDelete] = useState(null);
  const [activeTab, setActiveTab] = useState('mine');

  const auth = useSelector(state => state.auth);

  const dispatch = useDispatch();

  const classes = useStyles();

  const { ownedPipelines, sharedPipelines } = useMemo(() => {
    const ownedPipelines = [];
    const sharedPipelines = [];

    const { user } = auth;
    pipelines.forEach((pipeline) => {
      if (hasPipelineAccess(user.permissions, pipeline.owningConsortium)) {
        ownedPipelines.push(pipeline);
      } else {
        sharedPipelines.push(pipeline);
      }
    });

    return { ownedPipelines, sharedPipelines };
  }, [pipelines, auth]);

  const onCloseModal = () => {
    setPipelineToDelete(null);
  };

  const onOpenModal = pipelineId => () => {
    setPipelineToDelete(pipelineId);
  };

  const onDeletePipeline = () => {
    deletePipeline(pipelineToDelete)
      .catch((error) => {
        dispatch(notifyError(error.message));
      });

    onCloseModal();
  };

  const onChangeTab = (_, tab) => {
    setActiveTab(tab);
  };

  const renderPipelines = () => {
    const pipelinesToShow = activeTab === 'mine' ? ownedPipelines : sharedPipelines;

    if (pipelinesToShow.length === 0) {
      return (
        <Box padding={2}>
          <Typography variant="body2">
            No pipelines found
          </Typography>
        </Box>
      );
    }

    return pipelinesToShow.map(pipeline => (
      <ListItem
        key={`${pipeline.name}-list-item`}
        itemObject={pipeline}
        deleteItem={onOpenModal}
        owner={isPipelineOwner(auth.user.permissions, pipeline.owningConsortium)}
        itemOptions={{ actions: [], text: [] }}
        itemRoute="/dashboard/pipelines"
      />
    ));
  };

  return (
    <div>
      <div className="page-header">
        <Typography variant="h4">
          Pipelines
        </Typography>
        <Fab
          color="primary"
          component={Link}
          to="/dashboard/pipelines/new"
          className={classes.button}
          name="create-pipeline-button"
        >
          <AddIcon />
        </Fab>
      </div>

      <Tabs
        value={activeTab}
        onChange={onChangeTab}
        className={classes.tabs}
      >
        <Tab label="My Pipelines" value="mine" />
        <Tab label="Public Pipelines" value="public" />
      </Tabs>

      {renderPipelines()}

      <ListDeleteModal
        close={onCloseModal}
        deleteItem={onDeletePipeline}
        itemName="pipeline"
        show={Boolean(pipelineToDelete)}
      />
    </div>
  );
};

PipelinesList.propTypes = {
  pipelines: PropTypes.array,
  deletePipeline: PropTypes.func.isRequired,
};

PipelinesList.defaultProps = {
  pipelines: [],
};

const PipelinesListWithData = graphql(DELETE_PIPELINE_MUTATION,
  removeDocFromTableProp(
    'pipelineId',
    'deletePipeline',
    FETCH_ALL_PIPELINES_QUERY,
    'fetchAllPipelines',
  ))(PipelinesList);

export default PipelinesListWithData;
