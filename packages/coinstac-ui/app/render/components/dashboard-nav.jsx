import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Nav, NavItem } from 'react-bootstrap';
import { IndexLinkContainer, LinkContainer } from 'react-router-bootstrap';

const DashboardNav = ({ auth }) => {
  return (
    <Nav bsStyle="pills" stacked>
      <IndexLinkContainer to="/dashboard">
        <NavItem eventKey={1}>
          <span aria-hidden="true" className="glyphicon glyphicon-home" />
          {' '}
          Home
        </NavItem>
      </IndexLinkContainer>
      <LinkContainer to="/dashboard/consortia">
        <NavItem eventKey={2}>
          <span aria-hidden="true" className="glyphicon glyphicon-list" />
          {' '}
          Consortia
        </NavItem>
      </LinkContainer>
      <LinkContainer to="/dashboard/my-files">
        <NavItem eventKey={3}>
          <span aria-hidden="true" className="glyphicon glyphicon-list-alt" />
          {' '}
          My Files
        </NavItem>
      </LinkContainer>
      {auth.user.permissions.computation && auth.user.permissions.computations.write &&
        <LinkContainer to="/dashboard/submit-computation">
          <NavItem eventKey={4}>
            <span aria-hidden="true" className="glyphicon glyphicon-export" />
            {' '}
            Submit Computation
          </NavItem>
        </LinkContainer>
      }
      <LinkContainer to="/dashboard/test">
        <NavItem eventKey={5}>
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

