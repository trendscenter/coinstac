import { Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import React from 'react';

export default class BackButton extends React.Component {
    render() {
        const to = this.props.to;
        if (!to) {
            throw new ReferenceError('missing `to` attr');
        }
        return (
            <LinkContainer to={to}>
                <Button bsStyle="link" to={to}>
                    <span
                        className="glyphicon glyphicon-arrow-left"
                        aria-hidden="true">
                    </span>
                    {' Back'}
                </Button>
            </LinkContainer>
        );
    }
};
