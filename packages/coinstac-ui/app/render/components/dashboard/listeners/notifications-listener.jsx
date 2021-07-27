import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { ipcRenderer } from 'electron';
import { connect } from 'react-redux';
import { notifyWarning } from '../../../state/ducks/notifyAndLog';

function NotificationsListener({ notifyWarning }) {
  useEffect(() => {
    ipcRenderer.on('notify-warning', (event, arg) => {
      notifyWarning(arg);
    });
  }, []);

  return null;
}

NotificationsListener.propTypes = {
  notifyWarning: PropTypes.func.isRequired,
};

export default connect(null,
  {
    notifyWarning,
  })(NotificationsListener);
