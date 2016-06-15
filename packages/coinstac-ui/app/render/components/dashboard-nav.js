'use strict';
import app from 'ampersand-app';
import React from 'react';
import { Nav, NavItem } from 'react-bootstrap';
import { IndexLinkContainer, LinkContainer } from 'react-router-bootstrap';

export default class DashboardNav extends React.Component {
    render() {
        return (
            <Nav bsStyle="pills" stacked>
                <IndexLinkContainer to="/">
                    <NavItem>
                        <span
                            className="glyphicon glyphicon-home"
                            aria-hidden="true">
                        </span>
                        Home
                    </NavItem>
                </IndexLinkContainer>
                <LinkContainer to="/consortia">
                    <NavItem>
                        <span
                            className="glyphicon glyphicon-list"
                            aria-hidden="true">
                        </span>
                        Consortia
                    </NavItem>
                </LinkContainer>
                <LinkContainer to="/projects">
                    <NavItem>
                        <span
                            className="glyphicon glyphicon-list-alt"
                            aria-hidden="true">
                        </span>
                        Projects
                    </NavItem>
                </LinkContainer>
            </Nav>
        )
    }
}
