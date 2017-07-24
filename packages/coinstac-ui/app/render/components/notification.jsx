import NotificationSystem from 'react-notification-system';
import React from 'react';
import app from 'ampersand-app';
import { ipcRenderer } from 'electron';
import truncate from 'lodash/truncate';


export default class Notify extends React.Component {
  constructor(props) {
    super(props);

    this.handleAsyncError = this.handleAsyncError.bind(this);
    this.notificationSystem = null;
  }

  componentWillMount() {
    ipcRenderer.on('async-error', this.handleAsyncError);
  }

  componentDidMount() {
    this.notificationSystem = this.notificationSystem;
    app.notify = ({
      action,
      autoDismiss = 2,
      level = 'info',
      message,
    }) => this.push({ action, autoDismiss, level, message });
  }

  componentWillUnmount() {
    delete app.notify;
    delete this.notificationSystem;
    ipcRenderer.removeListener('async-error', this.handleAsyncError);
  }

  handleAsyncError(event, message) {
    this.push({
      autoDismiss: 0,
      level: 'error',
      message: truncate(message, { length: 250 }),
    });
  }

  /**
   * push a notification to the application
   * https://github.com/igorprado/react-notification-system#creating-a-notification
   * @param  {object} notification
   * @return {undefined}
   */
  push(notification) {
    this.notificationSystem.addNotification(notification);
  }

  render() {
    return <NotificationSystem ref={(c) => { this.notificationSystem = c; }} />;
  }
}
