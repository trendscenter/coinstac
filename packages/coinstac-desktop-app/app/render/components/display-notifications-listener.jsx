import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import Notification from './notification';

import { dequeueNotification } from '../state/ducks/notifyAndLog';

function DisplayNotificationsListener({ notifications, dequeueNotification }) {
  if (!notifications) return null;

  function onCloseNotification(notificationId) {
    dequeueNotification(notificationId);
  }

  return (
    <React.Fragment>
      {notifications.map((notification, index) => (
        <Notification
          key={notification.id}
          duration={5000}
          id={notification.id}
          message={notification.message}
          severity={notification.severity}
          index={index}
          onClose={onCloseNotification}
        />
      ))}
    </React.Fragment>
  );
}

DisplayNotificationsListener.defaultProps = {
  notifications: [],
};

DisplayNotificationsListener.propTypes = {
  notifications: PropTypes.array,
  dequeueNotification: PropTypes.func.isRequired,
};

const mapStateToProps = ({ notifications }) => ({
  notifications: notifications.notifications,
});

export default connect(mapStateToProps,
  {
    dequeueNotification,
  })(DisplayNotificationsListener);
