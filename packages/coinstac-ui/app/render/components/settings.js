import app from 'ampersand-app';
import { Button } from 'react-bootstrap';
import { connect } from 'react-redux';
import React, { Component, PropTypes } from 'react';

class Settings extends Component {
  constructor(props) {
    super(props);

    this.deleteUserData = this.deleteUserData.bind(this);
  }

  deleteUserData(event) {
    event.preventDefault();

    app.main.services.clean.userData(this.props.username)
      .then(didDelete => {
        if (didDelete) {
          app.notify('info', 'Logged out');

          // TODO: Figure why `nextTick` is needed
          process.nextTick(() => this.context.router.push('/login'));
        }
      })
      .catch(error => {
        app.logger.error(error);
        app.notify('error', `Could not remove user data: ${error.message}`);
      });
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
  username: PropTypes.string.isRequired,
};

function mapStateToProps(state) {
  return {
    username: state.auth.user.username,
  };
}

export default connect(mapStateToProps)(Settings);
