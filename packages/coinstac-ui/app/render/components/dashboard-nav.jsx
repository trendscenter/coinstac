import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Nav, NavItem } from 'react-bootstrap';
import { IndexLinkContainer, LinkContainer } from 'react-router-bootstrap';

class DashboardNav extends Component {
  render() {
    const { auth } = this.props;

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
        {auth.user.permissions.computations.write &&
          <LinkContainer to="/submit-computation">
            <NavItem>
              <span aria-hidden="true" className="glyphicon glyphicon-export" />
              {' '}
              Submit Computation
            </NavItem>
          </LinkContainer>
        }
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
}


DashboardNav.propTypes = {
  auth: PropTypes.object.isRequired,
};

const mapStateToProps = ({ auth }) => {
  return { auth };
};

export default connect(mapStateToProps)(DashboardNav);

