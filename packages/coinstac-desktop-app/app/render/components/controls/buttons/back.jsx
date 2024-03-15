import PropTypes from 'prop-types';
import React from 'react';
import { Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

export default function BackButton({ to }) {
  return (
    <LinkContainer to={to}>
      <Button bsStyle="link" to={to}>
        <span
          aria-hidden="true"
          className="glyphicon glyphicon-arrow-left"
        />
        {' Back'}
      </Button>
    </LinkContainer>
  );
}

BackButton.propTypes = {
  to: PropTypes.string.isRequired,
};
