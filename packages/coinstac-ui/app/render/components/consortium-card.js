'use strict';

import React from 'react';
import { Link } from 'react-router';
import { Button, ButtonToolbar } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

export default class ConsortiumCard extends React.Component {
  render() {
    return (
      <div className="consortium panel panel-default">
        <div className="panel-heading">
          <h2 className="panel-title">
            <Link
              to={{
                pathname: `/consortia/${this.props._id}`,
                query: { _id: this.props._id }
              }}
            >
              {this.props.label}
            </Link>
          </h2>
        </div>
        <div className="panel-body">
          <p>{this.props.description}</p>
          <ButtonToolbar>
            <LinkContainer
              to={{
                pathname: `/consortia/${this.props._id}`,
                query: { _id: this.props._id }
              }}
            >
              <Button bsSize="small">
                <span
                  className="glyphicon glyphicon glyphicon-eye-open"
                  aria-hidden="true"
                >
                </span>
                View
              </Button>
            </LinkContainer>
          </ButtonToolbar>
          <div className="row">
            <div className="consortium__tags col-xs-12 col-sm-6">
              <h5>Tags:</h5>
              {(this.props.tags || []).map(function (tag) {
                return (
                  <span key={tag.id} className="label label-default" >
                    {tag.id}
                  </span>
                );
              })}
            </div>
            <div className="consortium__users col-xs-12 col-sm-6">
              <h5>Users:</h5>
              <ul className="list-inline">
                {(this.props.users || []).map(function (username, ndx) {
                  return (
                    <li key={username + '_' + ndx}>{username}</li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
