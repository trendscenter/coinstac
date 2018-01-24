import { Button } from 'react-bootstrap';
import { connect } from 'react-redux';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { notifyError, notifyInfo } from '../../state/ducks/notifyAndLog';

class Settings extends Component {
  constructor(props) {
    super(props);

    this.deleteUserData = this.deleteUserData.bind(this);
  }

  render() {
    return (
      <div className="settings">
        <div className="page-header">
          <h1>Settings</h1>
        </div>
        <h2>Remove Data</h2>
        <form method="post" onSubmit={this.deleteUserData}>
          <h3 className="h4">Clear user data</h3>
          <p>
            Remove stored data for your user, including your projects.
            <strong>This action is permanent.</strong>
          </p>
          <Button bsStyle="danger" type="submit">
            Delete User Data
          </Button>
        </form>
      </div>
    );
  }
}

Settings.contextTypes = {
  router: PropTypes.object.isRequired,
};

Settings.propTypes = {
  notifyError: PropTypes.func.isRequired,
  notifyInfo: PropTypes.func.isRequired,
  username: PropTypes.string.isRequired,
};

function mapStateToProps(state) {
  return {
    username: state.auth.user.username,
  };
}

export default connect(mapStateToProps, { notifyError, notifyInfo })(Settings);
