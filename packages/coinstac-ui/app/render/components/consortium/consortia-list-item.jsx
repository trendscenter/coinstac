import React from 'react';
import PropTypes from 'prop-types';
import { Button, Panel } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

const ConsortiaListItem = ({ owner, user, consortium }) => (
  <Panel header={<h3>{consortium.name}</h3>}>
    <p>{consortium.description}</p>
    <LinkContainer to={`/consortia/${consortium.id}`}>
      <Button bsStyle="info">View Details</Button>
    </LinkContainer>
    {owner && <Button bsStyle="danger" className="pull-right">Delete Consortium</Button>}
    {user && !owner && <Button bsStyle="warning" className="pull-right">Leave Consortium</Button>}
    {!user && !owner && <Button bsStyle="primary" className="pull-right">Join Consortium</Button>}
  </Panel>
);

ConsortiaListItem.propTypes = {
  consortium: PropTypes.object.isRequired,
  owner: PropTypes.bool.isRequired,
  user: PropTypes.bool.isRequired,
};

export default ConsortiaListItem;
