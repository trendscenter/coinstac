import React from 'react';
import { Nav, NavItem } from 'react-bootstrap';
import { IndexLinkContainer, LinkContainer } from 'react-router-bootstrap';

export default function DashboardNav() {
  return (
    <Nav bsStyle="pills" stacked>
      <IndexLinkContainer to="/">
        <NavItem>
          <span aria-hidden="true" className="glyphicon glyphicon-home"></span>
          {' '}
          Home
        </NavItem>
      </IndexLinkContainer>
      <LinkContainer to="/consortia">
        <NavItem>
          <span aria-hidden="true" className="glyphicon glyphicon-list"></span>
            {' '}
            Consortia
        </NavItem>
      </LinkContainer>
      <LinkContainer to="/projects">
        <NavItem>
          <span aria-hidden="true" className="glyphicon glyphicon-list-alt"></span>
          {' '}
          Projects
        </NavItem>
      </LinkContainer>
    </Nav>
  );
}
