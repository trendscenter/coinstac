import {
  Button,
  ControlLabel,
  FormControl,
  FormGroup,
  HelpBlock,
} from 'react-bootstrap';
import React, { Component, PropTypes } from 'react';

import ConsortiumResult from './consortium-result';

class ConsortiumSingle extends Component {

  renderComputationResults() {
    const { computations, remoteResults } = this.props;

    if (!remoteResults || !remoteResults.length) {
      return (
        <p>
          <em>
            Pending consortium analysis kickoff. Get started and group data will
            show here.
          </em>
        </p>
      );
    }

    return (
      <ul className="list-unstyled">
        {remoteResults.map((result, index) => {
          const computation = computations.find(c => c._id === result._id);

          return (
            <li key={index}>
              <ConsortiumResult computation={computation} {...result} />
            </li>
          );
        })}
      </ul>
    );
  }

  renderComputationSelect() {
    const {
      computations,
      consortium: { activeComputationId, owners },
      updateComputation,
      user,
    } = this.props;

    const isOwner = owners.some(own => own === user.username);
    let helpBlock;

    if (!isOwner) {
      helpBlock = (
        <HelpBlock>
          Only consortium owners can select the staged analysis.
        </HelpBlock>
      );
    }

    return (
      <FormGroup controlId="formControlsSelect">
        <ControlLabel>Analysis</ControlLabel>
        <FormControl
          componentClass="select"
          disabled={!isOwner}
          onChange={updateComputation}
          placeholder="Select group analysis/computation"
          value={activeComputationId || 0}
        >
          <option disabled key="0">
            Select group analysis/computation
          </option>
          {computations.map(({ _id, name, version }) => {
            return <option key={_id} value={_id}>{name}@{version}</option>;
          })}
        </FormControl>
        {helpBlock}
      </FormGroup>
    );
  }

  renderMembershipButton() {
    const { isMember, user, removeUser, addUser } = this.props;
    if (isMember) {
      return (
        <Button
          block
          className="clearfix pull-right"
          onClick={() => removeUser(user.username)}
          type="button"
        >
        Leave Consortium
        </Button>
      );
    }
    return (
      <Button
        block
        bsStyle="success"
        className="clearfix pull-right"
        onClick={() => addUser(user.username)}
        type="button"
      >
      Join Consortium
      </Button>
    );
  }

  renderMemberContent() {
    return (
      <div ref="member-content">
        <div className="row">
          <div className="col-xs-12">
            <h2>Consortium Objective Analysis</h2>
            {this.renderComputationSelect()}
          </div>
        </div>
        <div className="row">
          <div className="col-xs-12 col-sm-6">
            <h3>Users:</h3>
            {this.renderUsers()}
          </div>
        </div>
        <h3>Results:</h3>
        <div>
          {this.renderComputationResults()}
        </div>
      </div>
    );
  }

  renderNonMemberConent() {
    return (<p>Please join the consortium to view member conent</p>);
  }

  renderTags() {
    const { consortium: { tags } } = this.props;
    return (
      <div>
      {tags.map((tag, index) => (<span key={index} className="label label-default">{tag}</span>))}
      </div>
    );
  }

  renderUsers() {
    const { consortium: { users } } = this.props;
    return (
      <ul className="list-inline">
        {users.map((username, index) => {
          return <li key={index}>{username}</li>;
        })}
      </ul>
    );
  }

  render() {
    const { consortium, isMember } = this.props;
    return (
      <div className="consortium-single">
        <h1>{consortium.label}</h1>
        {this.renderMembershipButton()}
        <p className="lead">{consortium.description}</p>
        {isMember ? this.renderMemberContent() : this.renderNonMemberConent()}
      </div>
    );
  }
}

ConsortiumSingle.displayName = 'ConsortiumSingle';

ConsortiumSingle.propTypes = {
  addUser: PropTypes.func.isRequired,
  computations: PropTypes.array.isRequired,
  consortium: PropTypes.object.isRequired,
  isMember: PropTypes.bool.isRequired,
  loading: PropTypes.object.isRequired,
  user: PropTypes.object.isRequired,
  updateComputation: PropTypes.func.isRequired,
  remoteResults: PropTypes.array.isRequired,
  removeUser: PropTypes.func.isRequired,
};

export default ConsortiumSingle;
