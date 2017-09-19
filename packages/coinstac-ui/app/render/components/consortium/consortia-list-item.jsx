import React from 'react';
import PropTypes from 'prop-types';
import { Panel } from 'react-bootstrap';

const ConsortiaListItem = ({ auth, consortia }) => (
  <Panel header={consortia.name} bsStyle="primary">
    <p>{consortia.description}</p>
    <p>
      {consortia.users.indexOf(auth.user.id) > -1 
        ? <Button></Button>
        : <Button></Button>
      }
    </p>
  </Panel>
);

ConsortiaListItem.propTypes = {
  auth: PropTypes.object.isRequired,
  consortia: PropTypes.array.isRequired,
};

export default ConsortiaListItem;
