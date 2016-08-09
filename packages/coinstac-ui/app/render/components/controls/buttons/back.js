import { Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import React, { PropTypes } from 'react';

export default function BackButton({ to }) {
  return (
    <LinkContainer to={to}>
      <Button bsStyle="link" to={to}>
        <span
          aria-hidden="true"
          className="glyphicon glyphicon-arrow-left"
        ></span>
        {' Back'}
      </Button>
    </LinkContainer>
  );
}

BackButton.propTypes = {
  to: PropTypes.string.isRequired,
};
