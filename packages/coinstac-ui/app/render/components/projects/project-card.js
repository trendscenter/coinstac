import React, { Component, PropTypes } from 'react';
import { Button, ButtonToolbar } from 'react-bootstrap';
import { Link } from 'react-router';
import { LinkContainer } from 'react-router-bootstrap';

export class ProjectCard extends Component {
  maybeRenderComputationRunButton() {
    const {
      allowComputationRun,
      runComputation,
      showComputationRunButton,
    } = this.props;

    if (showComputationRunButton) {
      return (
        <Button
          bsSize="small"
          bsStyle="primary"
          className="pull-right"
          disabled={!allowComputationRun}
          onClick={runComputation}
        >
          <span
            className="glyphicon glyphicon-repeat"
            aria-hidden="true"
          >
          </span>
          {' '}
          Run Computation
        </Button>
      );
    }
  }

  render() {
    const {
      id,
      name,
      removeProject,
    } = this.props;

    return (
      <div className="project panel panel-default">
        <div className="panel-body">
          <h4>
            <Link to={`/projects/${id}`}>{name}</Link>
          </h4>
          <p>ID: {id}</p>
          <div className="clearfix">
            <ButtonToolbar className="pull-left">
              <Button
                bsSize="small"
                bsStyle="danger"
                onClick={removeProject}
              >
                <span
                  className="glyphicon glyphicon-trash"
                  aria-hidden="true"
                >
                </span>
                {' '}
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
                  {' '}
                  Edit
                </Button>
              </LinkContainer>
            </ButtonToolbar>
            {this.maybeRenderComputationRunButton()}
          </div>
        </div>
      </div>
    );
  }
}

ProjectCard.propTypes = {
  allowComputationRun: PropTypes.bool.isRequired,
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  removeProject: PropTypes.func.isRequired,
  runComputation: PropTypes.func.isRequired,
  showComputationRunButton: PropTypes.bool.isRequired,
};
