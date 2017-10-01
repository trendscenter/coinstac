import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Nav, NavItem } from 'react-bootstrap';
import { IndexLinkContainer, LinkContainer } from 'react-router-bootstrap';

const DashboardNav = ({ auth: { user } }) => {
  return (
    <Nav bsStyle="pills" stacked>
      <IndexLinkContainer to="/">
        <NavItem eventKey={1}>
          <span aria-hidden="true" className="glyphicon glyphicon-home" />
          {' '}
          Home
        </NavItem>
      </IndexLinkContainer>
      <LinkContainer to="/computations">
        <NavItem eventKey={2}>
          <span aria-hidden="true" className="glyphicon glyphicon-hdd" />
          {' '}
          Computations
        </NavItem>
      </LinkContainer>
      <LinkContainer to="/consortia">
        <NavItem eventKey={3}>
          <span aria-hidden="true" className="glyphicon glyphicon-list" />
          {' '}
          Consortia
        </NavItem>
      </LinkContainer>
      <LinkContainer to="/my-files">
        <NavItem eventKey={4}>
          <span aria-hidden="true" className="glyphicon glyphicon-duplicate" />
          {' '}
          My Files
        </NavItem>
      </LinkContainer>
      <LinkContainer to="/pipelines">
        <NavItem eventKey={5}>
          <span aria-hidden="true" className="glyphicon glyphicon-tasks" />
          {' '}
          Pipelines
        </NavItem>
      </LinkContainer>
      <LinkContainer to="/test">
        <NavItem eventKey={7}>
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

const mapStateToProps = ({ auth }) => {
  return { auth };
};

export default connect(mapStateToProps)(DashboardNav);

