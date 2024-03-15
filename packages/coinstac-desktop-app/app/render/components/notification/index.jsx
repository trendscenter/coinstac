import Snackbar from '@material-ui/core/Snackbar';
import Alert from '@material-ui/lab/Alert';
import PropTypes from 'prop-types';
import React, { useState } from 'react';

import useStyles from './notification.styles';

function Notification({
  duration, id, message, severity, index, onClose,
}) {
  const classes = useStyles({ index });

  const [visible, setVisible] = useState(true);

  function handleClose(event, reason) {
    if (reason === 'clickaway') return;

    setVisible(false);
    onClose(id);
  }

  return (
    <Snackbar
      open={visible}
      onClose={handleClose}
      autoHideDuration={duration}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      className={classes.root}
    >
      <Alert severity={severity}>
        { message }
      </Alert>
    </Snackbar>
  );
}

Notification.propTypes = {
  duration: PropTypes.number.isRequired,
  id: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  severity: PropTypes.string.isRequired,
  index: PropTypes.number.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default Notification;
