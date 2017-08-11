import React from 'react';
import { Nav, NavItem } from 'react-bootstrap';
import { IndexLinkContainer, LinkContainer } from 'react-router-bootstrap';

export default function DashboardNav() {
  return (
    <Nav bsStyle="pills" stacked>
      <IndexLinkContainer to="/">
        <NavItem>
          <span aria-hidden="true" className="glyphicon glyphicon-home" />
          {' '}
          Home
        </NavItem>
      </IndexLinkContainer>
      <LinkContainer to="/consortia">
        <NavItem>
          <span aria-hidden="true" className="glyphicon glyphicon-list" />
          {' '}
            Consortia
        </NavItem>
      </LinkContainer>
      <LinkContainer to="/my-files">
        <NavItem>
          <span aria-hidden="true" className="glyphicon glyphicon-list-alt" />
          {' '}
          My Files
        </NavItem>
      </LinkContainer>
      <LinkContainer to="/test">
        <NavItem>
          <span aria-hidden="true" className="glyphicon glyphicon-sunglasses" />
          {' '}
          Feature Test
        </NavItem>
      </LinkContainer>
    </Nav>
  );
}
