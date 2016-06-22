import React, { Component, PropTypes } from 'react';
import { Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { connect } from 'react-redux';
import {
  fetch as fetchProjects,
  remove as removeProject,
  setProjects,
} from 'app/render/state/ducks/projects.js';
import { ProjectCard } from './project-card.js';
import { hilarious } from 'app/render/utils/hilarious-loading-messages.js';
import app from 'ampersand-app';

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

  render() {
    const { projects } = this.props;

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
            return (
              <ProjectCard
                key={`project-card-${project._id}`}
                {...this.props}
                project={project}
                delete={() => this.delete(project)}
              />
            );
          })}
        </div>
      </div>
    );
  }
}

ProjectsList.propTypes = {
  dispatch: PropTypes.func.isRequired,
  projects: PropTypes.array,
};

function select(state) {
  return {
    projects: state.projects,
  };
}

export default connect(select)(ProjectsList);
