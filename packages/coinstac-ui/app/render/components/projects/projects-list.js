import React from 'react';
import { Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { connect } from 'react-redux';
import { fetch as fetchProjects, remove as removeProject, setProjects } from 'app/render/state/ducks/projects.js';
import { ProjectCard } from './project-card.js';
import { hilarious } from 'app/render/utils/hilarious-loading-messages.js';
import app from 'ampersand-app';
import _ from 'lodash';

class ProjectsList extends React.Component {

  constructor(props) {
    super(props);
    this.state = {};
    const { dispatch } = props;
    dispatch(fetchProjects((err) => {
      if (err) { return; }
      this.setState({ ready: true });
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
    const { projects, loading } = this.props;
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
                              key={'project-card-' + project._id}
                              {...this.props}
                              project={project}
                              delete={evt => this.delete(project)}
                            />
                        );
                    })}
                </div>
            </div>
        );
  }
}

function select(state) {
  return {
    projects: state.projects,
    loading: state.loading,
  };
}

export default connect(select)(ProjectsList);
