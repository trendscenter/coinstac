import React from 'react';
import PropTypes from 'prop-types';
import { Button, Panel } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

const ListItem = ({ owner, itemOptions, itemObject, itemRoute, deleteItem }) => (
  <Panel header={<h3>{itemObject.name}</h3>}>
    <p>{itemObject.description}</p>
    {itemOptions.text}
    <LinkContainer to={`${itemRoute}/${itemObject.id}`} name={itemObject.name}>
      <Button bsStyle="info">View Details</Button>
    </LinkContainer>
    {owner &&
      <Button
        bsStyle="danger"
        onClick={deleteItem(itemObject.id)}
        className="pull-right"
        name={`${itemObject.name}-delete`}
      >
        Delete
      </Button>
    }
    {itemOptions.actions}
  </Panel>
);

ListItem.defaultProps = {
  owner: false,
};

ListItem.propTypes = {
  itemObject: PropTypes.object.isRequired,
  itemOptions: PropTypes.object.isRequired,
  itemRoute: PropTypes.string.isRequired,
  owner: PropTypes.bool,
  deleteItem: PropTypes.func.isRequired,
};

export default ListItem;
