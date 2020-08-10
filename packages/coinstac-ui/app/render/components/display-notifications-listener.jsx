import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withSnackbar } from 'notistack';
import { dequeueNotification } from '../state/ducks/notifyAndLog';

class DisplayNotificationsListener extends React.Component {
  componentDidUpdate(prevProps) {
    const { enqueueSnackbar, dequeueNotification, notifications } = this.props;

    if (notifications.length > prevProps.notifications.length) {
      const lastNotification = notifications[notifications.length - 1];

      enqueueSnackbar(lastNotification.message, {
        variant: lastNotification.severity,
        anchorOrigin: {
          vertical: 'bottom',
          horizontal: 'left',
        },
      });

      dequeueNotification();
    }
  }

  render() {
    return null;
  }
}

DisplayNotificationsListener.defaultProps = {
  notifications: [],
};

DisplayNotificationsListener.propTypes = {
  notifications: PropTypes.array,
  dequeueNotification: PropTypes.func.isRequired,
  enqueueSnackbar: PropTypes.func.isRequired,
};

const mapStateToProps = ({ notifications }) => ({
  notifications: notifications.notifications,
});

const connectedComponent = connect(mapStateToProps,
  {
    dequeueNotification,
  })(DisplayNotificationsListener);

export default withSnackbar(connectedComponent);
