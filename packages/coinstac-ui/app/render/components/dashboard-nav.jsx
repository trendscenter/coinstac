import React from 'react';
import PropTypes from 'prop-types';
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
      <LinkContainer to="/dashboard/my-files">
        <NavItem>
          <span aria-hidden="true" className="glyphicon glyphicon-list-alt" />
          {' '}
          My Files
        </NavItem>
      </LinkContainer>
      <LinkContainer to="/dashboard/pipelines">
        <NavItem>
          <span aria-hidden="true" className="glyphicon glyphicon-tasks" />
          {' '}
          Pipelines
        </NavItem>
      </LinkContainer>
      <LinkContainer to="/dashboard/test">
        <NavItem>
          <span aria-hidden="true" className="glyphicon glyphicon-sunglasses" />
          {' '}
          Feature Test
        </NavItem>
      </LinkContainer>
    </Nav>
  );
};

DashboardNav.propTypes = {
  auth: PropTypes.object.isRequired,
};

export default DashboardNav;

