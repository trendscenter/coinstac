import { Button } from 'react-bootstrap';
import { connect } from 'react-redux';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';
import MemberAvatar from '../common/member-avatar';

class UserAccount extends Component {
  render() {
    const { logoutUser, auth } = this.props;

    if (auth.user) {
      const { id, label, email } = auth.user;

      return (
        <div className="user-account media">
          <div className="media-left">
            <MemberAvatar
              consRole="Member"
              name={id}
              width={40}
            />
          </div>
          <div className="media-body">
            <h4 className="user-account-name media-heading">{label}</h4>
            <p className="user-account-email">{email}</p>
            <Link
              aria-label="settings"
              className="user-account-settings btn btn-link btn-block"
              title="Settings"
              to="dashboard/settings"
            >
              <span
                aria-hidden="true"
                className="glyphicon glyphicon-cog"
              />
              {' '}
              Settings
            </Link>
            <Button
              block
              bsStyle="link"
              className="user-account-logout"
              onClick={logoutUser}
              to="/login"
            >
              <span
                aria-hidden="true"
                className="glyphicon glyphicon-log-out"
              />
              {' '}
              Log Out
            </Button>
          </div>
        </div>
      );
    }

    return <div className="user-account media" />;
  }
}

UserAccount.displayName = 'UserAccount';

UserAccount.propTypes = {
  logoutUser: PropTypes.func.isRequired,
  auth: PropTypes.object.isRequired,
};

const mapStateToProps = ({ auth }) => {
  return { auth };
};

export default connect(mapStateToProps)(UserAccount);
