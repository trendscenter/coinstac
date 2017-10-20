import React from 'react';
import { graphql, compose } from 'react-apollo';
import PropTypes from 'prop-types';
import { Button, Panel } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { deleteConsortiumByIdFunc, fetchAllConsortiaFunc, joinConsortiumFunc, leaveConsortiumFunc } from '../../state/graphql/functions';

const ConsortiaListItem = ({
  owner,
  member,
  consortium,
  deleteConsortium,
  joinConsortium,
  leaveConsortium,
}) => (
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
        onClick={() => leaveConsortium(consortium.id)}
        className="pull-right"
      >
        Leave Consortium
      </Button>
    }
    {!member && !owner &&
      <Button
        bsStyle="primary"
        onClick={() => joinConsortium(consortium.id)}
        className="pull-right"
      >
        Join Consortium
      </Button>
    }
  </Panel>
);

ConsortiaListItem.propTypes = {
  consortium: PropTypes.object.isRequired,
  owner: PropTypes.bool.isRequired,
  member: PropTypes.bool.isRequired,
  deleteConsortium: PropTypes.func.isRequired,
  joinConsortium: PropTypes.func.isRequired,
  leaveConsortium: PropTypes.func.isRequired,
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
          const index = data.fetchAllConsortia.findIndex(con => con.id === joinConsortium.id);
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
  })
)(ConsortiaListItem);

export default ConsortiaListItemWithData;
