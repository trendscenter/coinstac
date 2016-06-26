import React, { Component, PropTypes } from 'react';
import { Button, ButtonToolbar } from 'react-bootstrap';
import { Link } from 'react-router';
import { LinkContainer } from 'react-router-bootstrap';

export class ProjectCard extends Component {
  render() {
    const { id, name, removeProject } = this.props;

    return (
      <div className="project panel panel-default">
        <div className="panel-body">
          <h4>
            <Link to={`/projects/${id}`}>{name}</Link>
          </h4>
          <p>ID: {id}</p>
          <ButtonToolbar>
            <Button
              bsSize="small"
              bsStyle="danger"
              onClick={removeProject}
            >
              Delete
            </Button>
            <LinkContainer
              to={`/projects/${id}`}
            >
              <Button bsSize="small">
                <span
                  className="glyphicon glyphicon-cog"
                  aria-hidden="true"
                >
                </span>
                Edit
              </Button>
            </LinkContainer>
          </ButtonToolbar>
        </div>
      </div>
    );
  }
}

ProjectCard.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  removeProject: PropTypes.func.isRequired,
};
