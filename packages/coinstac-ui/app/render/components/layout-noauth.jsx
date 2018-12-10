import React from 'react';
import PropTypes from 'prop-types';
import { LinkContainer } from 'react-router-bootstrap';
import { Nav, NavItem } from 'react-bootstrap';

import CoinstacAbbr from './coinstac-abbr';

export default function LayoutNoAuth({ children }) {
  return (
    <div className="screen account">
      <div className="container-fluid">
        <div className="row">
          <div className="col-xs-12 col-sm-6 col-sm-offset-3 col-md-4 col-md-offset-4">
            <div className="screen__content">
              <CoinstacAbbr />
              <Nav bsStyle="pills" justified>
                <LinkContainer to="/login">
                  <NavItem>Log In</NavItem>
                </LinkContainer>
                <LinkContainer to="/signup">
                  <NavItem>Sign Up</NavItem>
                </LinkContainer>
              </Nav>
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

LayoutNoAuth.displayName = 'LayoutNoAuth';

LayoutNoAuth.propTypes = {
  children: PropTypes.node.isRequired,
};
