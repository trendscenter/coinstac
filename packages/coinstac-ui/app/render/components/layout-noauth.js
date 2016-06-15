import React, { Component, PropTypes } from 'react';
import { LinkContainer } from 'react-router-bootstrap';
import { Nav, NavItem } from 'react-bootstrap';

const LayoutNoAuth = ({ children }) => {
    return (
        <div className="screen account">
            <div className="container-fluid">
                <div className="row">
                    <div className="col-xs-12 col-sm-6 col-sm-offset-3 col-md-4 col-md-offset-4">
                        <div className="screen__content">
                            <h1 className="logo text-center">
                                <abbr title="Collaborative Informatics and Neuroimaging Suite Toolkit for Anonymous Computation">COINSTAC</abbr>
                            </h1>
                            <Nav bsStyle="pills" justifed>
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
};

LayoutNoAuth.displayName = 'LayoutNoAuth';

LayoutNoAuth.propTypes = {
    children: PropTypes.node.isRequired,
};

export default LayoutNoAuth;
