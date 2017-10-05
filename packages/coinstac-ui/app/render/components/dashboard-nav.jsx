import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Nav, NavItem } from 'react-bootstrap';
import { IndexLinkContainer, LinkContainer } from 'react-router-bootstrap';

const DashboardNav = ({ auth: { user } }) => {
  return (
    <Nav bsStyle="pills" stacked>
      <IndexLinkContainer to="/">
        <NavItem>
          <span aria-hidden="true" className="glyphicon glyphicon-home" />
          {' '}
          Home
        </NavItem>
      </IndexLinkContainer>
      <LinkContainer to="/computations">
        <NavItem>
          <span aria-hidden="true" className="glyphicon glyphicon-hdd" />
          {' '}
          Computations
        </NavItem>
      </LinkContainer>
      <LinkContainer to="/consortia">
        <NavItem>
          <span aria-hidden="true" className="glyphicon glyphicon-list" />
          {' '}
          Consortia
        </NavItem>
      </LinkContainer>
      <LinkContainer to="/my-files">
        <NavItem>
          <span aria-hidden="true" className="glyphicon glyphicon-duplicate" />
          {' '}
          My Files
        </NavItem>
      </LinkContainer>
      <LinkContainer to="/pipelines">
        <NavItem>
          <span aria-hidden="true" className="glyphicon glyphicon-tasks" />
          {' '}
          Pipelines
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
};

DashboardNav.propTypes = {
  auth: PropTypes.object.isRequired,
};

export default DashboardNav;

