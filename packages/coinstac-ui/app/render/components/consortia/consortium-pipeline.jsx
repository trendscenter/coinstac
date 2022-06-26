import React, { useState, useEffect, useMemo } from 'react';
import { graphql } from '@apollo/react-hoc';
import { Link } from 'react-router';
import Joyride from 'react-joyride';
import Paper from '@material-ui/core/Paper';
import Divider from '@material-ui/core/Divider';
import Button from '@material-ui/core/Button';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/Add';
import PropTypes from 'prop-types';
import {
  SAVE_ACTIVE_PIPELINE_MUTATION,
} from '../../state/graphql/functions';
import {
  consortiumSaveActivePipelineProp,
} from '../../state/graphql/props';
import { PIPELINE_TUTORIAL_STEPS, VAULT_TUTORIAL_STEPS } from '../../constants/tutorial';

const styles = theme => ({
  tabTitle: {
    marginTop: theme.spacing(2),
  },
  paper: {
    padding: theme.spacing(2),
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(3),
  },
  pipelinesActions: {
    marginTop: theme.spacing(2),
  },
  pipelineDropdownsContainer: {
    display: 'flex',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  pipelineButton: {
    marginTop: theme.spacing(2),
  },
  newPipelineContainer: {
    marginTop: theme.spacing(4),
    textAlign: 'center',
  },
  createPipelineHint: {
    marginBottom: theme.spacing(1),
  },
});

function ConsortiumPipeline({
  consortium, owner, classes, pipelines, showPipelineTutorial,
  showVaultTutorial, pipelineTutorialChange, vaultTutorialChange,
  saveActivePipeline,
}) {
  const [activePipeline, setActivePipeline] = useState(null);

  useEffect(() => {
    if (!consortium || !consortium.activePipelineId) return;

    const activePipeline = pipelines.find(p => p.id === consortium.activePipelineId);
    setActivePipeline(activePipeline);
  }, []);

  const [ownedPipelines, sharedPipelines] = useMemo(() => {
    const owned = pipelines.filter(p => p.owningConsortium === consortium.id);
    const shared = pipelines.filter(p => p.owningConsortium !== consortium.id);

    return [owned, shared];
  }, [pipelines]);

  const [ownedPipelinesAnchorEl, setOwnedPipelinesAnchorEl] = useState(null);

  function openOwnedPipelinesMenu(event) {
    setOwnedPipelinesAnchorEl(event.currentTarget);
  }

  function closeOwnedPipelinesMenu() {
    setOwnedPipelinesAnchorEl(null);
  }

  const [sharedPipelinesAnchorEl, setSharedPipelinesAnchorEl] = useState(null);

  function openSharedPipelinesMenu(event) {
    setSharedPipelinesAnchorEl(event.currentTarget);
  }

  function closeSharedPipelinesMenu() {
    setSharedPipelinesAnchorEl(null);
  }

  const selectPipeline = pipelineId => async () => {
    closeOwnedPipelinesMenu();

    await saveActivePipeline(consortium.id, pipelineId);

    const activePipeline = pipelines.find(p => p.id === pipelineId);

    setActivePipeline(activePipeline);
  };

  return (
    <div>
      <Typography variant="h5" className={classes.tabTitle}>
        Active Pipeline
      </Typography>
      <Paper className={classes.paper}>
        {activePipeline && activePipeline.id ? (
          <div>
            <Typography
              variant="h6"
              component={Link}
              to={`/dashboard/pipelines/${consortium.activePipelineId}`}
            >
              {activePipeline.name}
            </Typography>
            <Typography variant="body2">
              {activePipeline.description}
            </Typography>
          </div>
        ) : (
          <Typography variant="body2"><em>No active pipeline</em></Typography>
        )}
      </Paper>
      {owner && (
        <div className={classes.pipelinesActions}>
          <Typography variant="h5">Activate a pipeline from...</Typography>
          <Divider />
          <div className={classes.pipelineDropdownsContainer}>
            <div className={classes.pipelineButton}>
              <Button
                id="owned-pipelines-dropdown"
                variant="contained"
                color="primary"
                onClick={openOwnedPipelinesMenu}
              >
                Owned Pipelines
              </Button>
              <Menu
                id="owned-pipelines-dropdown-menu"
                anchorEl={ownedPipelinesAnchorEl}
                open={Boolean(ownedPipelinesAnchorEl)}
                onClose={closeOwnedPipelinesMenu}
              >
                {ownedPipelines && ownedPipelines.map(pipe => (
                  <MenuItem
                    key={`owned-${pipe.id}`}
                    onClick={selectPipeline(pipe.id)}
                  >
                    {pipe.name}
                  </MenuItem>
                ))}
              </Menu>
            </div>
            <div className={classes.pipelineButton}>
              <Button
                id="shared-pipelines-dropdown"
                variant="contained"
                color="primary"
                onClick={openSharedPipelinesMenu}
              >
                Pipelines Shared With Me
              </Button>
              <Menu
                id="shared-pipelines-dropdown-menu"
                anchorEl={sharedPipelinesAnchorEl}
                open={Boolean(sharedPipelinesAnchorEl)}
                onClose={closeSharedPipelinesMenu}
              >
                {sharedPipelines && sharedPipelines.map(pipe => (
                  <MenuItem
                    key={`shared-${pipe.id}`}
                    onClick={selectPipeline(pipe.id)}
                  >
                    {pipe.name}
                  </MenuItem>
                ))}
              </Menu>
            </div>
          </div>
          <div className={classes.newPipelineContainer}>
            <Typography variant="body2" className={classes.createPipelineHint}><em>Or create a new pipeline</em></Typography>
            <Button
              id="new-pipeline"
              variant="contained"
              color="secondary"
              component={Link}
              to={`/dashboard/pipelines/new/${consortium.id}`}
            >
              New Pipeline
              <AddIcon />
            </Button>
          </div>
        </div>
      )}
      {showPipelineTutorial && (
        <Joyride
          steps={PIPELINE_TUTORIAL_STEPS.consortiumPipeline}
          disableScrollParentFix
          callback={pipelineTutorialChange}
        />
      )}
      {showVaultTutorial && (
        <Joyride
          steps={VAULT_TUTORIAL_STEPS.consortiumPipeline}
          disableScrollParentFix
          callback={vaultTutorialChange}
        />
      )}
    </div>
  );
}

ConsortiumPipeline.propTypes = {
  classes: PropTypes.object.isRequired,
  consortium: PropTypes.object.isRequired,
  owner: PropTypes.bool.isRequired,
  pipelines: PropTypes.array.isRequired,
  showPipelineTutorial: PropTypes.bool.isRequired,
  showVaultTutorial: PropTypes.bool.isRequired,
  saveActivePipeline: PropTypes.func.isRequired,
  pipelineTutorialChange: PropTypes.func.isRequired,
  vaultTutorialChange: PropTypes.func.isRequired,
};

// TODO: Move this to shared props?
const ConsortiumPipelineWithData = graphql(SAVE_ACTIVE_PIPELINE_MUTATION, consortiumSaveActivePipelineProp('saveActivePipeline'))(ConsortiumPipeline);

export default withStyles(styles)(ConsortiumPipelineWithData);
