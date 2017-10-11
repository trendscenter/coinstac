import React from 'react';
import { graphql } from 'react-apollo';
import PropTypes from 'prop-types';
import { Button, Panel } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { deleteConsortiumByIdFunc, fetchAllConsortiaFunc } from '../../state/graphql/functions';

const ConsortiaListItem = ({ owner, user, consortium, deleteConsortium }) => (
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
    {user && !owner && <Button bsStyle="warning" className="pull-right">Leave Consortium</Button>}
    {!user && !owner && <Button bsStyle="primary" className="pull-right">Join Consortium</Button>}
  </Panel>
);

ConsortiaListItem.propTypes = {
  consortium: PropTypes.object.isRequired,
  owner: PropTypes.bool.isRequired,
  user: PropTypes.bool.isRequired,
  deleteConsortium: PropTypes.func.isRequired,
};

const ConsortiaListItemWithData = graphql(deleteConsortiumByIdFunc, {
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
})(ConsortiaListItem);

export default ConsortiaListItemWithData;
