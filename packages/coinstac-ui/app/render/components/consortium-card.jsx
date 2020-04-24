import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';
import { Button, ButtonToolbar } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import UserList from './user/user-list';

export default function ConsortiumCard(props) {
  const {
    _id: id,
    deleteConsortium,
    description,
    isMember,
    isOwner,
    joinConsortium,
    label,
    leaveConsortium,
    users,
  } = props;

  let deleteButton;
  let membershipButton;
  let editOrViewText;

  const labelNoSpace = label.replace(' ', '-');
  if (isOwner) {
    deleteButton = (
      <Button
        bsSize="small"
        bsStyle="danger"
        onClick={deleteConsortium}
        id={`delete-${labelNoSpace}`}
      >
        <span
          aria-hidden="true"
          className="glyphicon glyphicon glyphicon-remove"
        />
        {' '}
        Delete
      </Button>
    );
    editOrViewText = 'Edit/View';
  } else {
    membershipButton = isMember
      ? (
        <Button bsSize="small" bsStyle="warning" onClick={leaveConsortium}>
          <span
            aria-hidden="true"
            className="glyphicon glyphicon glyphicon-minus"
          />
          {' '}
        Leave
        </Button>
      )
      : (
        <Button bsSize="small" bsStyle="success" onClick={joinConsortium}>
          <span
            aria-hidden="true"
            className="glyphicon glyphicon glyphicon-plus"
          />
          {' '}
        Join
        </Button>
      );
    editOrViewText = 'View';
  }

  return (
    <div className="consortium-card panel panel-default">
      <div className="panel-heading">
        <h4 className="panel-title">
          <Link to={`/consortia/${id}`}>{label}</Link>
        </h4>
      </div>
      <div className="panel-body">
        <div className="row">
          <div className="col-sm-6">
            <p>{description}</p>
          </div>
          <div className="col-sm-6">
            <h5>Users:</h5>
            <UserList users={users} />
          </div>
        </div>
        <div className="clearfix">
          <div className="pull-left">
            {deleteButton}
          </div>
          <ButtonToolbar className="pull-right">
            {membershipButton}
            <LinkContainer to={`/dashboard/consortia/${id}`}>
              <Button bsSize="small">
                <span
                  aria-hidden="true"
                  className="glyphicon glyphicon glyphicon-eye-open"
                />
                {' '}
                {editOrViewText}
              </Button>
            </LinkContainer>
          </ButtonToolbar>
        </div>
      </div>
    </div>
  );
}

ConsortiumCard.propTypes = {
  _id: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  isMember: PropTypes.bool.isRequired,
  isOwner: PropTypes.bool.isRequired,
  label: PropTypes.string.isRequired,
  users: PropTypes.arrayOf(PropTypes.string).isRequired,
  deleteConsortium: PropTypes.func.isRequired,
  joinConsortium: PropTypes.func.isRequired,
  leaveConsortium: PropTypes.func.isRequired,
};
