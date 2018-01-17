import React from 'react';
import PropTypes from 'prop-types';
import { Button, Panel } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

const ListItem = ({ owner, itemObject, itemOptions, itemRoute, deleteItem }) => (
  <Panel header={<h3>{itemObject.name}</h3>}>
    <p>{itemObject.description}</p>
    <LinkContainer to={`${itemRoute}/${itemObject.id}`}>
      <Button bsStyle="info">View Details</Button>
    </LinkContainer>
    {owner &&
      <Button
        bsStyle="danger"
        onClick={() => deleteItem(itemObject.id)}
        className="pull-right"
      >
        Delete Item
      </Button>
    }
    {itemOptions}
  </Panel>
);

ListItem.propTypes = {
  itemObject: PropTypes.object.isRequired,
  itemOptions: PropTypes.array.isRequired,
  itemRoute: PropTypes.string.isRequired,
  owner: PropTypes.bool.isRequired,
  deleteItem: PropTypes.func.isRequired,
};

export default ListItem;
