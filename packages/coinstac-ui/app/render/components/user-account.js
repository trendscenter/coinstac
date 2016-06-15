import { Button } from 'react-bootstrap';
import md5 from 'md5';
import React, { Component, PropTypes } from 'react';

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
    const { logout, user: { label, email } } = this.props;

    return (
            <div className="user-account">
                <div className="media">
                    <div className="media-left">
                        <img
                          className="media-object img-rounded"
                          height="50"
                          src={this.getAvatarUrl()}
                          width="50"
    />
                    </div>
                    <div className="media-body">
                        <strong className="block">{label}</strong>
                        <br />
                        <em className="h6">{email}</em>
                        <br />
                        <Button onClick={logout} bsSize="xsmall" to="login">Log Out</Button>
                    </div>
                </div>
            </div>
        );
  }
}

UserAccount.displayName = 'UserAccount';

UserAccount.propTypes = {
  logout: PropTypes.func.isRequired,
  user: PropTypes.shape({
    email: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
  }).isRequired,
};

export default UserAccount;
