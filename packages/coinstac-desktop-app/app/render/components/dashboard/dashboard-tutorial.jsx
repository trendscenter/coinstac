import React from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

const DashboardTutorial = ({ open, onClose }) => (
  <Dialog
    open={open}
    onClose={() => onClose(false)}
    aria-labelledby="alert-dialog-title"
    aria-describedby="alert-dialog-description"
  >
    <DialogTitle id="alert-dialog-title">Do you want to see the tutorial for running pipeline?</DialogTitle>
    <DialogContent>
      <DialogContentText id="alert-dialog-description">
        Please follow the red mark to start pipeline.
        <br />
        You can turn on tutorial in settings.
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={() => onClose(false)} color="secondary">
        Yes
      </Button>
      <Button onClick={() => onClose(true)} color="primary">
        Never Show Again
      </Button>
    </DialogActions>
  </Dialog>
);

DashboardTutorial.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default DashboardTutorial;
