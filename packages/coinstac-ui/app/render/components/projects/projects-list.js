import React, { Component, PropTypes } from 'react';
import { Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { connect } from 'react-redux';
import {
  fetch as fetchProjects,
  remove as removeProject,
  setProjects,
} from '../../state/ducks/projects.js';
import { ProjectCard } from './project-card.js';
import { hilarious } from '../../utils/hilarious-loading-messages.js';
import app from 'ampersand-app';
import { runComputation } from '../../state/ducks/bg-services';

class ProjectsList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ready: false,
    };
  }

  componentWillMount() {
    const { dispatch } = this.props;

    dispatch(fetchProjects((err) => {
      if (err) {
        app.logger.error(err);
        app.notify('error', `Failed to load projects: ${err.message}`);
      } else {
        this.setState({ ready: true });
      }
    }));
  }

  componentWillUnmount() {
    const { dispatch } = this.props;
    dispatch(setProjects(null));
  }

  delete(project) {
    const { dispatch } = this.props;
    dispatch(removeProject(project));
  }

  /**
   * Run a computation.
   *
   * @param {Object} project
   * @param {string} project._id
   * @param {string} project.consortiumId
   */
  runComputation({ _id: projectId, consortiumId }) {
    const { dispatch } = this.props;

    dispatch(runComputation({ consortiumId, projectId }))
      .catch((err) => {
        app.notify('error', err.message);
      });
  }

  render() {
    const { consortia, projects, username } = this.props;

    if (!this.state.ready) {
      return (<span>{hilarious.random()}</span>);
    }

    return (
      <div>
        <LinkContainer to="/projects/new" id="add_project">
          <Button bsStyle="primary" className="pull-right">
            <strong>+</strong>
            Add Project
          </Button>
        </LinkContainer>
        <div className="projects-list">
          {projects.map(project => {
            const allowComputationRun = false;
            const consortium = consortia.find(c => {
              return c._id === project.consortiumId;
            });

            const showComputationRunButton =
              !!consortium && consortium.owners.indexOf(username) > -1;

            return (
              <ProjectCard
                allowComputationRun={allowComputationRun}
                id={project._id}
                key={`project-card-${project._id}`}
                name={project.name}
                removeProject={() => this.delete(project)}
                runComputation={() => this.runComputation(project)}
                showComputationRunButton={showComputationRunButton}
              />
            );
          })}
        </div>
      </div>
    );
  }
}

ProjectsList.propTypes = {
  consortia: PropTypes.arrayOf(PropTypes.object).isRequired,
  dispatch: PropTypes.func.isRequired,
  projects: PropTypes.array,
  username: PropTypes.string.isRequired,
};

function select(state) {
  return {
    consortia: state.consortia,
    projects: state.projects,
    username: state.auth.user.username,
  };
}

export default connect(select)(ProjectsList);
