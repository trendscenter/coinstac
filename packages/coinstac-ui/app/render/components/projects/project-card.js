import React, { Component, PropTypes } from 'react';
import { Button, ButtonToolbar } from 'react-bootstrap';
import { Link } from 'react-router';
import { LinkContainer } from 'react-router-bootstrap';

export class ProjectCard extends Component {
  maybeRenderComputationRunButton() {
    const {
      allowComputationRun,
      isInvalidMapping,
      runComputation,
      showComputationRunButton,
    } = this.props;

    if (showComputationRunButton) {
      return (
        <Button
          bsSize="small"
          bsStyle="primary"
          className="pull-right"
          disabled={isInvalidMapping || !allowComputationRun}
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
    const { computationStatus, isInvalidMapping } = this.props;
    const className = `project-status ${(
      isInvalidMapping ?
        ProjectCard.computationStatusClassNames.get('error') :
        ProjectCard.computationStatusClassNames.get(computationStatus)
    )}`;
    let status;

    if (isInvalidMapping) {
      status = (
        <span>
          <span aria-hidden="true" className="glyphicon glyphicon-exclamation-sign"></span>
          {' '}
          Must remap covariates
        </span>
      );
    } else if (computationStatus === 'active') {
      status = (
        <span>
          <span aria-hidden="true" className="glyphicon glyphicon-refresh"></span>
          {' '}
          Running
        </span>
      );
    } else if (computationStatus === 'complete') {
      status = (
        <span>
          <span aria-hidden="true" className="glyphicon glyphicon-ok"></span>
          {' '}
          Complete
        </span>
      );
    } else if (computationStatus === 'error') {
      status = (
        <span>
          <span aria-hidden="true" className="glyphicon glyphicon-alert"></span>
          {' '}
          Error
        </span>
      );
    } else if (computationStatus === 'waiting') {
      status = (
        <span>
          <span aria-hidden="true" className="glyphicon glyphicon-alert"></span>
          {' '}
          Waiting to start
        </span>
      );
    } else {
      status = <span>Unknown status</span>;
    }

    return <div className={className}>{status}</div>;
  }

  render() {
    const {
      consortiumName,
      id,
      name,
      removeProject,
    } = this.props;

    return (
      <div className="project-card panel panel-default">
        <div className="panel-heading">
          <h4 className="panel-title">
            <Link to={`/my-files/${id}`}>{name}</Link>
          </h4>
          {this.renderComputationStatus()}
        </div>
        <div className="panel-body">
          <p>Consortium: {consortiumName}</p>
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
                to={`/my-files/${id}`}
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
  consortiumName: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  isInvalidMapping: PropTypes.bool.isRequired,
  name: PropTypes.string.isRequired,
  removeProject: PropTypes.func.isRequired,
  runComputation: PropTypes.func.isRequired,
  showComputationRunButton: PropTypes.bool.isRequired,
};
