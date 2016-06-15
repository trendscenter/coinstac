import React from 'react';
import { Button, ButtonToolbar } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import _ from 'lodash';
import app from 'ampersand-app';

export class ProjectCard extends React.Component {
    render() {
        const { project } = this.props;
        return (
            <div key={project._id} className="project panel panel-default">
                <div className="panel-body">
                    <h4>
                        <Link to={`/projects/${project._id}`}>
                            {project.name}
                        </Link>
                    </h4>
                    <p>ID: {project._id}</p>
                    <ButtonToolbar>
                        <Button
                            bsSize="small"
                            bsStyle="danger"
                            onClick={ this.props.delete }>
                            Delete
                        </Button>
                        <LinkContainer
                            to={`/projects/edit/${project._id}`}
                            query={{_id: this.props._id}}>
                            <Button bsSize="small">
                                <span
                                    className="glyphicon glyphicon-cog"
                                    aria-hidden="true">
                                </span>
                                 Edit
                            </Button>
                        </LinkContainer>
                    </ButtonToolbar>
                </div>
            </div>
        );
    }
}
