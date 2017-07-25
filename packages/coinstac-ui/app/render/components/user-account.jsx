import { Button } from 'react-bootstrap';
import md5 from 'md5';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

class UserAccount extends Component {
  constructor(props) {
    super(props);
    this.getAvatarUrl = this.getAvatarUrl.bind(this);
  }
  getAvatarUrl() {
    const { user: { email } } = this.props;

    return `http://www.gravatar.com/avatar/${md5(email)}?s=200`;
  }
  render() {
    const { logoutUser, user } = this.props;

    if (user) {
      const { label, email } = user;

      return (
        <div className="user-account media">
          <div className="media-left">
            <img
              alt={label}
              className="media-object img-rounded"
              height="50"
              src={this.getAvatarUrl()}
              width="50"
            />
          </div>
          <div className="media-body">
            <h4 className="user-account-name media-heading">{label}</h4>
            <p className="user-account-email">{email}</p>
            <Link
              aria-label="settings"
              className="user-account-settings btn btn-link btn-block"
              title="Settings"
              to="/settings"
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
  user: PropTypes.shape({
    email: PropTypes.string,
    label: PropTypes.string,
  }),
};

UserAccount.defaultProps = {
  user: null,
};

export default UserAccount;
