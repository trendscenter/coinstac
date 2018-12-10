import React from 'react';
import PropTypes from 'prop-types';
import { Button, Panel } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

const MapsItem = ({ itemOptions, itemObject, itemRoute, itemMapped, pipelineId }) => (
  <div className="col col-sm-4">
    <Panel header={<h3>{itemObject.name}</h3>}>
      <p>{itemObject.description}</p>
      {itemOptions.text}
      <p>Active Pipeline: {pipelineId}</p>
      <LinkContainer to={`${itemRoute}/${itemObject.id}`}>
        {itemMapped ?
          <Button bsStyle="info">View Details</Button> :
          <Button bsStyle="warning">Map Data to Consortia</Button>}
      </LinkContainer>
      {itemOptions.actions}
      {itemMapped ?
        <span className="mapped true"></span> :
        <span className="mapped false"></span>
      }
    </Panel>
  </div>
);

MapsItem.defaultProps = {
  owner: false,
};

MapsItem.propTypes = {
  itemObject: PropTypes.object.isRequired,
  itemRoute: PropTypes.string.isRequired,
  pipelineId: PropTypes.string.isRequired,
  owner: PropTypes.bool,
};

export default MapsItem;
