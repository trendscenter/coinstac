import React from 'react';
import { Nav, NavItem } from 'react-bootstrap';
import { IndexLinkContainer, LinkContainer } from 'react-router-bootstrap';

const DashboardNav = () => {
  return (
    <Nav bsStyle="pills" stacked>
      <IndexLinkContainer to="/dashboard">
        <NavItem>
          <span aria-hidden="true" className="glyphicon glyphicon-home" />
          {' '}
          Home
        </NavItem>
      </IndexLinkContainer>
      <LinkContainer to="/dashboard/computations">
        <NavItem>
          <span aria-hidden="true" className="glyphicon glyphicon-hdd" />
          {' '}
          Computations
        </NavItem>
      </LinkContainer>
      <LinkContainer to="/dashboard/consortia">
        <NavItem>
          <span aria-hidden="true" className="glyphicon glyphicon-list" />
          {' '}
          Consortia
        </NavItem>
      </LinkContainer>
      <LinkContainer to="/dashboard/collections">
        <NavItem>
          <span aria-hidden="true" className="glyphicon glyphicon-list-alt" />
          {' '}
          Collections
        </NavItem>
      </LinkContainer>
      <LinkContainer to="/dashboard/pipelines">
        <NavItem>
          <span aria-hidden="true" className="glyphicon glyphicon-tasks" />
          {' '}
          Pipelines
        </NavItem>
      </LinkContainer>
      <LinkContainer to="/dashboard/results">
        <NavItem>
          <span aria-hidden="true" className="glyphicon glyphicon-equalizer" />
          {' '}
          Results
        </NavItem>
      </LinkContainer>
    </Nav>
  );
};

export default DashboardNav;

