import React from 'react';
import PropTypes from 'prop-types';
import { ipcRenderer } from 'electron';
import { connect } from 'react-redux';
import { notifyWarning } from '../../../state/ducks/notifyAndLog';

class NotificationsListener extends React.Component {
  componentDidMount() {
    const { notifyWarning } = this.props;

    ipcRenderer.on('notify-warning', (event, arg) => {
      notifyWarning(arg);
    });
  }

  render() {
    return null;
  }
}

NotificationsListener.propTypes = {
  notifyWarning: PropTypes.func.isRequired,
};

export default connect(null,
  {
    notifyWarning,
  })(NotificationsListener);
