/**
 * Add notifications for computation runs and completion.
 *
 * @todo Consider moving the notifications to a better location.
 */

import app from 'ampersand-app';
import { hashHistory } from 'react-router';

/**
 * Get a run error function.
 *
 * @param {Object} consortium
 * @returns {Function}
 */
export function getRunErrorNotifier(consortium) {
  return (error) => {
    app.notifications.push({
      autoDismiss: 1,
      level: 'error',
      message: `Error running computation for “${consortium.label}”: ${error.message}`,
    });
  };
}

/**
 * Get a run end function.
 *
 * @param {Object} consortium
 * @returns {Function}
 */
export function getRunEndNotifier(consortium) {
  return () => {
    app.notifications.push({
      autoDismiss: 1,
      level: 'info',
      message: `Ran computation for “${consortium.label}”`,
    });
  };
}

/**
 * Add a computation start notification.
 *
 * @param {Object} consortium
 */
export function computationStartNotification(consortium) {
  app.notifications.push({
    autoDismiss: 1,
    level: 'info',
    message: `Starting computation for “${consortium.label}”`,
  });
}

/**
 * Add a computation complete notification.
 *
 * @param {Object} consortium
 */
export function computationCompleteNotification(consortium) {
  app.notifications.push({
    action: {
      label: 'View Results',
      callback: () => hashHistory.push(`/consortia/${consortium._id}`),
    },
    autoDismiss: 4,
    level: 'success',
    message: `Computation for “${consortium.label}” complete`,
  });
}
