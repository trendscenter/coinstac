import { Button } from 'react-bootstrap';
import { connect } from 'react-redux';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { notifyError, notifyInfo } from '../../state/ducks/notifyAndLog';
import { clearCollectionsAndConsortia } from '../../state/ducks/collections';
import { clearRuns } from '../../state/ducks/runs';

class Settings extends Component {
  constructor(props) {
    super(props);

    this.clearData = this.clearData.bind(this);
  }

  clearData(e) {
    e.preventDefault();
    this.props.clearRuns();
    this.props.clearCollectionsAndConsortia();
    this.props.notifyInfo({ message: 'Local data cleared' });
  }

  render() {
    return (
      <div className="settings">
        <div className="page-header">
          <h1>Settings</h1>
        </div>
        <h2>Remove Data</h2>
        <form method="post" onSubmit={this.clearData}>
          <h3 className="h4">Clear local data</h3>
          <p>
            Remove stored data on your machine, including your collections.
            <strong>This action is permanent.</strong>
          </p>
          <Button bsStyle="danger" type="submit">
            Delete Local Data
          </Button>
        </form>
      </div>
    );
  }
}

Settings.propTypes = {
  clearCollectionsAndConsortia: PropTypes.func.isRequired,
  clearRuns: PropTypes.func.isRequired,
  notifyInfo: PropTypes.func.isRequired,
};

Settings.contextTypes = {
  router: PropTypes.object.isRequired,
};

export default connect(null, {
  clearCollectionsAndConsortia,
  clearRuns,
  notifyError,
  notifyInfo,
})(Settings);
