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

  renderComputationStatus() {
    const { computationStatus } = this.props;
    const className = `project-status ${ProjectCard.computationStatusClassNames.get(
      computationStatus
    )}`;
    let status;

    switch (computationStatus) {
      case 'active':
        status = (
          <span>
            <span aria-hidden="true" className="glyphicon glyphicon-refresh"></span>
            {' '}
            Running
          </span>
        );
        break;
      case 'complete':
        status = (
          <span>
            <span aria-hidden="true" className="glyphicon glyphicon-ok"></span>
            {' '}
            Complete
          </span>
        );
        break;
      case 'error':
        status = (
          <span>
            <span aria-hidden="true" className="glyphicon glyphicon-alert"></span>
            {' '}
            Error
          </span>
        );
        break;
      case 'waiting':
        status = (
          <span>
            <span aria-hidden="true" className="glyphicon glyphicon-alert"></span>
            {' '}
            Waiting to start
          </span>
        );
        break;
      default:
        status = <span>Unknown status</span>;
    }

    return <div className={className}>{status}</div>;
  }

  render() {
    const {
      id,
      name,
      removeProject,
    } = this.props;

    return (
      <div className="project-card panel panel-default">
        <div className="panel-heading">
          <h4 className="panel-title">
            <Link to={`/projects/${id}`}>{name}</Link>
          </h4>
          {this.renderComputationStatus()}
        </div>
        <div className="panel-body">
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

ProjectCard.computationStatusClassNames = new Map([
  ['active', 'is-active text-muted'],
  ['complete', 'text-success'],
  ['error', 'text-danger'],
  ['waiting', 'text-muted'],
]);

ProjectCard.propTypes = {
  allowComputationRun: PropTypes.bool.isRequired,
  computationStatus: PropTypes.oneOf([
    'active',
    'complete',
    'error',
    'waiting',
  ]).isRequired,
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  removeProject: PropTypes.func.isRequired,
  runComputation: PropTypes.func.isRequired,
  showComputationRunButton: PropTypes.bool.isRequired,
};
