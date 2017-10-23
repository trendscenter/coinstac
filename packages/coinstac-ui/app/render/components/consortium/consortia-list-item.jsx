import React, { Component } from 'react';
import { connect } from 'react-redux';
import { graphql, compose } from 'react-apollo';
import PropTypes from 'prop-types';
import { Button, Panel } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { updateUserPerms } from '../../state/ducks/auth';
import { userRolesProp } from '../../state/graphql/props';
import {
  ADD_USER_ROLE_MUTATION,
  REMOVE_USER_ROLE_MUTATION,
  deleteConsortiumByIdFunc,
  fetchAllConsortiaFunc,
  joinConsortiumFunc,
  leaveConsortiumFunc,
} from '../../state/graphql/functions';

class ConsortiaListItem extends Component {
  constructor(props) {
    super(props);

    this.joinConsortium = this.joinConsortium.bind(this);
    this.leaveConsortium = this.leaveConsortium.bind(this);
  }

  joinConsortium() {
    const { auth: { user }, consortium } = this.props;

    this.props.joinConsortium(consortium.id);
    this.props.addUserRole(user.id, 'consortia', consortium.id, 'member');
  }

  leaveConsortium() {
    const { auth: { user }, consortium } = this.props;

    this.props.leaveConsortium(consortium.id);
    this.props.removeUserRole(user.id, 'consortia', consortium.id, 'member');
  }

  render() {
    const {
      owner,
      member,
      consortium,
      deleteConsortium,
    } = this.props;

    return (
      <Panel header={<h3>{consortium.name}</h3>}>
        <p>{consortium.description}</p>
        <LinkContainer to={`/dashboard/consortia/${consortium.id}`}>
          <Button bsStyle="info">View Details</Button>
        </LinkContainer>
        {owner &&
          <Button
            bsStyle="danger"
            onClick={() => deleteConsortium(consortium.id)}
            className="pull-right"
          >
            Delete Consortium
          </Button>
        }
        {member && !owner &&
          <Button
            bsStyle="warning"
            onClick={this.leaveConsortium}
            className="pull-right"
          >
            Leave Consortium
          </Button>
        }
        {!member && !owner &&
          <Button
            bsStyle="primary"
            onClick={this.joinConsortium}
            className="pull-right"
          >
            Join Consortium
          </Button>
        }
      </Panel>
    );
  }
}

ConsortiaListItem.propTypes = {
  addUserRole: PropTypes.func.isRequired,
  auth: PropTypes.object.isRequired,
  consortium: PropTypes.object.isRequired,
  owner: PropTypes.bool.isRequired,
  member: PropTypes.bool.isRequired,
  deleteConsortium: PropTypes.func.isRequired,
  joinConsortium: PropTypes.func.isRequired,
  leaveConsortium: PropTypes.func.isRequired,
  removeUserRole: PropTypes.func.isRequired,
};

const ConsortiaListItemWithData = compose(
  graphql(deleteConsortiumByIdFunc, {
    props: ({ mutate }) => ({
      deleteConsortium: consortiumId => mutate({
        variables: { consortiumId },
        update: (store, { data: { deleteConsortiumById } }) => {
          const data = store.readQuery({ query: fetchAllConsortiaFunc });
          const index = data.fetchAllConsortia.findIndex(con => con.id === deleteConsortiumById.id);
          if (index > -1) {
            data.fetchAllConsortia.splice(index, 1);
          }
          store.writeQuery({ query: fetchAllConsortiaFunc, data });
        },
      }),
    }),
  }),
  graphql(joinConsortiumFunc, {
    props: ({ mutate }) => ({
      joinConsortium: consortiumId => mutate({
        variables: { consortiumId },
        update: (store, { data: { joinConsortium } }) => {
          const data = store.readQuery({ query: fetchAllConsortiaFunc });
          const index = data.fetchAllConsortia
            .findIndex(con => con.id === joinConsortium.id);
          if (index > -1) {
            data.fetchAllConsortia[index].members = joinConsortium.members;
          }
          store.writeQuery({ query: fetchAllConsortiaFunc, data });
        },
      }),
    }),
  }),
  graphql(leaveConsortiumFunc, {
    props: ({ mutate }) => ({
      leaveConsortium: consortiumId => mutate({
        variables: { consortiumId },
        update: (store, { data: { leaveConsortium } }) => {
          const data = store.readQuery({ query: fetchAllConsortiaFunc });
          const index = data.fetchAllConsortia.findIndex(con => con.id === leaveConsortium.id);
          if (index > -1) {
            data.fetchAllConsortia[index].members = leaveConsortium.members;
          }
          store.writeQuery({ query: fetchAllConsortiaFunc, data });
        },
      }),
    }),
  }),
  graphql(ADD_USER_ROLE_MUTATION, userRolesProp('addUserRole')),
  graphql(REMOVE_USER_ROLE_MUTATION, userRolesProp('removeUserRole'))
)(ConsortiaListItem);

function mapStateToProps({ auth }) {
  return { auth };
}

export default connect(mapStateToProps, { updateUserPerms })(ConsortiaListItemWithData);
