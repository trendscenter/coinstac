import React, { Component } from 'react';
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
import memoize from 'memoize-one';
import {
  SAVE_ACTIVE_PIPELINE_MUTATION,
} from '../../state/graphql/functions';
import {
  consortiumSaveActivePipelineProp,
} from '../../state/graphql/props';
import STEPS from '../../constants/tutorial';

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

class ConsortiumPipeline extends Component {
  filterOwnedPipelines = memoize(
    (pipelines, consortiumId) => pipelines.filter(pipe => pipe.owningConsortium === consortiumId)
  );

  filterSharedPipelines = memoize(
    (pipelines, consortiumId) => pipelines.filter(pipe => pipe.owningConsortium !== consortiumId)
  );

  constructor(props) {
    super(props);

    this.state = {
      activePipeline: {},
      openOwnedPipelinesMenu: false,
      openSharedPipelinesMenu: false,
    };

    this.openOwnedPipelinesMenu = this.openOwnedPipelinesMenu.bind(this);
    this.closeOwnedPipelinesMenu = this.closeOwnedPipelinesMenu.bind(this);
    this.openSharedPipelinesMenu = this.openSharedPipelinesMenu.bind(this);
    this.closeSharedPipelinesMenu = this.closeSharedPipelinesMenu.bind(this);
  }

  componentDidMount() {
    const { consortium, pipelines } = this.props;

    if (consortium && consortium.activePipelineId) {
      const activePipeline = pipelines.find(p => p.id === consortium.activePipelineId);

      this.setState({ activePipeline });
    }
  }

  selectPipeline = pipelineId => async () => {
    const { consortium, saveActivePipeline, pipelines } = this.props;

    this.closeOwnedPipelinesMenu();
    this.closeSharedPipelinesMenu();

    await saveActivePipeline(consortium.id, pipelineId);

    const activePipeline = pipelines.find(p => p.id === pipelineId);

    this.setState({ activePipeline });
  }

  openOwnedPipelinesMenu(event) {
    this.ownedPipelinesButtonElement = event.currentTarget;
    this.setState({ openOwnedPipelinesMenu: true });
  }

  closeOwnedPipelinesMenu() {
    this.setState({ openOwnedPipelinesMenu: false });
  }

  openSharedPipelinesMenu(event) {
    this.sharedPipelinesButtonElement = event.currentTarget;
    this.setState({ openSharedPipelinesMenu: true });
  }

  closeSharedPipelinesMenu() {
    this.setState({ openSharedPipelinesMenu: false });
  }

  render() {
    const {
      consortium,
      owner,
      classes,
      pipelines,
      isTutorialHidden,
      tutorialChange,
    } = this.props;

    const {
      activePipeline,
      openOwnedPipelinesMenu,
      openSharedPipelinesMenu,
    } = this.state;

    const ownedPipelines = this.filterOwnedPipelines(pipelines, consortium.id);
    const sharedPipelines = this.filterSharedPipelines(pipelines, consortium.id);

    return (
      <div>
        <Typography variant="h5" className={classes.tabTitle}>
          Active Pipeline
        </Typography>
        <Paper className={classes.paper}>
          {activePipeline
            && activePipeline.id
            && (
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
            )
          }
          {
            !(activePipeline && activePipeline.id) && <Typography variant="body2"><em>No active pipeline</em></Typography>
          }
        </Paper>
        {
          owner
          && (
            <div className={classes.pipelinesActions}>
              <Typography variant="h5">Activate a pipeline from...</Typography>
              <Divider />
              <div className={classes.pipelineDropdownsContainer}>
                <div className={classes.pipelineButton}>
                  <Button
                    id="owned-pipelines-dropdown"
                    variant="contained"
                    color="primary"
                    onClick={this.openOwnedPipelinesMenu}
                  >
                    Owned Pipelines
                  </Button>
                  <Menu
                    id="owned-pipelines-dropdown-menu"
                    anchorEl={this.ownedPipelinesButtonElement}
                    open={openOwnedPipelinesMenu}
                    onClose={this.closeOwnedPipelinesMenu}
                  >
                    {
                      ownedPipelines && ownedPipelines.map(pipe => (
                        <MenuItem
                          key={`owned-${pipe.id}`}
                          onClick={this.selectPipeline(pipe.id)}
                        >
                          {pipe.name}
                        </MenuItem>
                      ))
                    }
                  </Menu>
                </div>
                <div className={classes.pipelineButton}>
                  <Button
                    id="shared-pipelines-dropdown"
                    variant="contained"
                    color="primary"
                    onClick={this.openSharedPipelinesMenu}
                  >
                    Pipelines Shared With Me
                  </Button>
                  <Menu
                    id="shared-pipelines-dropdown-menu"
                    anchorEl={this.sharedPipelinesButtonElement}
                    open={openSharedPipelinesMenu}
                    onClose={this.closeSharedPipelinesMenu}
                  >
                    {
                      sharedPipelines && sharedPipelines.map(pipe => (
                        <MenuItem
                          key={`owned-${pipe.id}`}
                          onClick={this.selectPipeline(pipe.id)}
                        >
                          {pipe.name}
                        </MenuItem>
                      ))
                    }
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
          )
        }
        {!isTutorialHidden && (
          <Joyride
            steps={STEPS.consortiumPipeline}
            disableScrollParentFix
            callback={tutorialChange}
          />
        )}
      </div>
    );
  }
}

ConsortiumPipeline.propTypes = {
  classes: PropTypes.object.isRequired,
  consortium: PropTypes.object.isRequired,
  owner: PropTypes.bool.isRequired,
  pipelines: PropTypes.array.isRequired,
  isTutorialHidden: PropTypes.bool.isRequired,
  saveActivePipeline: PropTypes.func.isRequired,
  tutorialChange: PropTypes.func.isRequired,
};

// TODO: Move this to shared props?
const ConsortiumPipelineWithData = graphql(SAVE_ACTIVE_PIPELINE_MUTATION, consortiumSaveActivePipelineProp('saveActivePipeline'))(ConsortiumPipeline);

export default withStyles(styles)(ConsortiumPipelineWithData);
