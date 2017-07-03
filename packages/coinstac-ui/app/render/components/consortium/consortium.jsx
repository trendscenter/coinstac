import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button } from 'react-bootstrap';

import ConsortiumComputationInputsViewer from
  './consortium-computation-inputs-viewer';
import ConsortiumForm from './consortium-form';
import ConsortiumTags from './consortium-tags';
import ConsortiumResults from './consortium-results';
import ConsortiumUsers from './consortium-users';

export default class Consortium extends Component {
  constructor(props) {
    super(props);

    this.maybeRenderResults = this.maybeRenderResults.bind(this);
    this.maybeRenderUsers = this.maybeRenderUsers.bind(this);
    this.renderDetails = this.renderDetails.bind(this);
  }

  maybeRenderResults() {
    const {
      computations,
      isMember,
      isNew,
      remoteResults,
      initialResultId,
    } = this.props;

    if (!isNew && isMember) {
      return (
        <ConsortiumResults
          computations={computations}
          remoteResults={remoteResults}
          initialResultId={initialResultId}
        />
      );
    }
  }

  maybeRenderUsers() {
    const {
      addUser,
      consortium,
      isMember,
      isNew,
      isOwner,
      removeUser,
      username,
    } = this.props;
    let memberButton;

    if (isNew) {
      return;
    }

    if (!isOwner) {
      memberButton = isMember ?
      (
        <Button bsStyle="danger" onClick={() => removeUser(username)}>
          <span
            aria-hidden="true"
            className="glyphicon glyphicon glyphicon-minus"
          />
          {' '}
          Leave
        </Button>
      ) :
      (
        <Button bsStyle="success" onClick={() => addUser(username)}>
          <span
            aria-hidden="true"
            className="glyphicon glyphicon glyphicon-plus"
          />
          {' '}
          Join
        </Button>
      );
    }

    return (
      <section className="section clearfix">
        <ConsortiumUsers users={consortium.users} />
        <div className="pull-right">{memberButton}</div>
      </section>
    );
  }

  renderDetails() {
    const {
      computations,
      consortium,
      isLoading,
      isOwner,
      isNew,
      onSubmit,
      onReset,
    } = this.props;
    const consortiumFormProps = {
      computations,
      consortium,
      isLoading,
      isNew,
      isOwner,
      onReset,
      onSubmit,
    };

    if (isNew) {
      return (
        <div className="consortium-details">
          <div className="page-header clearfix">
            <h1 className="pull-left">Add New Consortium</h1>
          </div>
          <ConsortiumForm {...consortiumFormProps} />
        </div>
      );
    } else if (isOwner) {
      return (
        <div className="consortium-details">
          <ConsortiumForm {...consortiumFormProps} />
        </div>
      );
    }

    const inputsViewerProps = {};

    if (consortium.activeComputationId) {
      const activeComputation = computations.find(({ _id }) => {
        return _id === consortium.activeComputationId;
      });

      if (activeComputation) {
        inputsViewerProps.computation = {
          name: activeComputation.meta.name,
          version: activeComputation.version,
        };

        if (
          Array.isArray(activeComputation.inputs) &&
          activeComputation.inputs.length
        ) {
          inputsViewerProps.inputs = activeComputation.inputs[0];
          inputsViewerProps.values = consortium.activeComputationInputs[0];
        }
      }
    }

    return (
      <div className="consortium-details">
        <div className="page-header clearfix">
          <h1>{consortium.label}</h1>
        </div>
        <p className="lead section">{consortium.description}</p>
        <ConsortiumTags tags={consortium.tags} />
        <ConsortiumComputationInputsViewer {...inputsViewerProps} />
      </div>
    );
  }

  render() {
    return (
      <div className="consortium">
        {this.renderDetails()}
        {this.maybeRenderUsers()}
        {this.maybeRenderResults()}
      </div>
    );
  }
}

Consortium.displayName = 'Consortium';

Consortium.propTypes = {
  addUser: PropTypes.func.isRequired,
  initialResultId: PropTypes.string,
  computations: PropTypes.arrayOf(PropTypes.object).isRequired,
  consortium: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    activeComputationInputs: PropTypes.array.isRequired,
    description: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    owners: PropTypes.arrayOf(PropTypes.string).isRequired,
    users: PropTypes.arrayOf(PropTypes.string).isRequired,
  }),
  isLoading: PropTypes.bool.isRequired,
  isMember: PropTypes.bool.isRequired,
  isNew: PropTypes.bool.isRequired,
  isOwner: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  remoteResults: PropTypes.arrayOf(PropTypes.object).isRequired,
  removeUser: PropTypes.func.isRequired,
  username: PropTypes.string.isRequired,
};
