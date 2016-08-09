import {
  Alert,
  Button,
  ControlLabel,
  FormControl,
  FormGroup,
  HelpBlock,
} from 'react-bootstrap';
import React, { Component, PropTypes } from 'react';

import ConsortiumResult from './consortium-result';
import UserList from './user-list';

class ConsortiumSingle extends Component {

  renderComputationResults() {
    const { computations, remoteResults } = this.props;

    if (!remoteResults || !remoteResults.length) {
      return (
        <Alert bsStyle="info">
          Pending consortium analysis kickoff. Get started and group data will
          show here.
        </Alert>
      );
    }

    return (
      <ul className="list-unstyled">
        {remoteResults.map((result, index) => {
          const computation = computations.find(c => {
            return c._id === result.computationId;
          });

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
        <ControlLabel srOnly>Analysis</ControlLabel>
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
    const {
      addUser,
      isMember,
      isOwner,
      removeUser,
      user: { username },
    } = this.props;

    if (!isOwner) {
      return isMember ?
      (
        <Button bsStyle="danger" onClick={() => removeUser(username)}>
          <span
            aria-hidden="true"
            className="glyphicon glyphicon glyphicon-minus"
          ></span>
          {' '}
          Leave
        </Button>
      ) :
      (
        <Button bsStyle="success" onClick={() => addUser(username)}>
          <span
            aria-hidden="true"
            className="glyphicon glyphicon glyphicon-plus"
          ></span>
          {' '}
          Join
        </Button>
      );
    }
  }

  renderMemberContent() {
    return (
      <div>
        <section className="section">
          <h2 className="h4">Analysis:</h2>
          {this.renderComputationSelect()}
        </section>
        <section>
          <h2 className="h4">Results:</h2>
          {this.renderComputationResults()}
        </section>
      </div>
    );
  }

  renderNonMemberConent() {
    return (
      <section>
        <Alert bsStyle="info">Join the consortium to view member content</Alert>
      </section>
    );
  }

  renderTags() {
    const { consortium: { tags } } = this.props;
    return (
      <div>
      {tags.map((tag, index) => (<span key={index} className="label label-default">{tag}</span>))}
      </div>
    );
  }

  render() {
    const { consortium, consortium: { users }, isMember } = this.props;
    return (
      <div className="consortium-single">
        <div className="page-header clearfix">
          <h1>{consortium.label}</h1>
        </div>
        <p className="lead section">{consortium.description}</p>
        <section className="section clearfix">
          <h2 className="h4">Users:</h2>
          <UserList size="large" users={users} />
          <div className="pull-right">
            {this.renderMembershipButton()}
          </div>
        </section>
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
  isOwner: PropTypes.bool.isRequired,
  loading: PropTypes.object.isRequired,
  user: PropTypes.object.isRequired,
  updateComputation: PropTypes.func.isRequired,
  remoteResults: PropTypes.array.isRequired,
  removeUser: PropTypes.func.isRequired,
};

export default ConsortiumSingle;
