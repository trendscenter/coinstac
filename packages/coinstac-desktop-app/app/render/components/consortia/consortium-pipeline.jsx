import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Paper from '@material-ui/core/Paper';
import makeStyles from '@material-ui/core/styles/makeStyles';
import Typography from '@material-ui/core/Typography';
import AddIcon from '@material-ui/icons/Add';
import PropTypes from 'prop-types';
import React, { useMemo, useState } from 'react';
import Joyride from 'react-joyride';
import { Link } from 'react-router';

import { TUTORIAL_STEPS } from '../../constants';

const useStyles = makeStyles(theme => ({
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
}));

function ConsortiumPipeline({
  consortium,
  owner,
  pipelines,
  isTutorialHidden,
  tutorialChange,
  saveActivePipeline,
}) {
  const classes = useStyles();

  const activePipeline = useMemo(() => pipelines
    .find(p => p.id === consortium.activePipelineId), [pipelines, consortium]);

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

  const selectPipeline = (pipelineId) => {
    closeOwnedPipelinesMenu();
    saveActivePipeline(pipelineId);
  };

  const unsetPipeline = () => {
    saveActivePipeline(null);
  };

  return (
    <div>
      <Typography variant="h5" className={classes.tabTitle}>
        Active Pipeline
      </Typography>
      <Paper className={classes.paper}>
        {activePipeline && activePipeline.id ? (
          <Box display="flex" alignItems="center" justifyContent="space-between">
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
            <Button
              id="unset-active-pipeline"
              variant="contained"
              color="primary"
              onClick={unsetPipeline}
            >
              Unset
            </Button>
          </Box>
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
                    onClick={() => selectPipeline(pipe.id)}
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
                    onClick={() => selectPipeline(pipe.id)}
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
      {!isTutorialHidden && (
        <Joyride
          steps={TUTORIAL_STEPS.consortiumPipeline}
          disableScrollParentFix
          callback={tutorialChange}
        />
      )}
    </div>
  );
}

ConsortiumPipeline.propTypes = {
  consortium: PropTypes.object.isRequired,
  owner: PropTypes.bool.isRequired,
  pipelines: PropTypes.array.isRequired,
  isTutorialHidden: PropTypes.bool.isRequired,
  saveActivePipeline: PropTypes.func.isRequired,
  tutorialChange: PropTypes.func.isRequired,
};

export default ConsortiumPipeline;
