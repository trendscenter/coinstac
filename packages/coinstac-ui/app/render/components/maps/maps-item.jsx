import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Panel } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';


class MapsItem extends Component {
    constructor(props) {
      super(props);
    }

    render() {
      const {
        itemOptions,
        itemObject,
        itemMapped,
        pipelineId,
        setConsortium
      } = this.props;

      return (
        <div className="col col-sm-4">
          <Panel header={<h3>{itemObject.name}</h3>}>
            <p>{itemObject.description}</p>
            {itemOptions.text}
            <p>Active Pipeline: {pipelineId}</p>
            {itemMapped ?
              <Button bsStyle="info"
               onClick={() => setConsortium(itemObject)}>
              View Details</Button> :
              <Button bsStyle="warning"
               onClick={() => setConsortium(itemObject)}>
               Map Data to Consortia</Button>
            }
            {itemOptions.actions}
            {itemMapped ?
              <span className="mapped true"></span> :
              <span className="mapped false"></span>
            }
          </Panel>
        </div>
    );
  }
}

MapsItem.defaultProps = {
  owner: false,
};

MapsItem.propTypes = {
  itemObject: PropTypes.object.isRequired,
  pipelineId: PropTypes.string.isRequired,
  owner: PropTypes.bool,
};

export default MapsItem;
