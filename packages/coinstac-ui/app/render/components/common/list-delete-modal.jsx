import React from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import WarningIcon from '@material-ui/icons/Warning';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  warningMessageContainer: {
    display: 'flex',
    alignItems: 'center',
    marginTop: theme.spacing.unit * 2,
  },
  warningMessage: {
    marginTop: theme.spacing.unit * 0.5,
    marginLeft: theme.spacing.unit * 0.5,
  },
});

const ListDeleteModal = ({
  close,
  deleteItem,
  itemName,
  show,
  warningMessage,
  classes,
}) => (
  <Dialog id="list-delete-modal" open={show} onClose={close}>
    <DialogTitle>
      Delete
    </DialogTitle>
    <DialogContent>
      <DialogContentText>
        {`Are you sure you want to delete this ${itemName}?`}
      </DialogContentText>
      {
        warningMessage
        && (
          <div className={classes.warningMessageContainer}>
            <WarningIcon />
            <DialogContentText className={classes.warningMessage}>
              { warningMessage }
            </DialogContentText>
          </div>
        )
      }
    </DialogContent>
    <DialogActions>
      <Button onClick={close}>Cancel</Button>
      <Button color="primary" onClick={deleteItem}>Delete</Button>
    </DialogActions>
  </Dialog>
);

ListDeleteModal.defaultProps = {
  warningMessage: null,
};

ListDeleteModal.propTypes = {
  classes: PropTypes.object.isRequired,
  itemName: PropTypes.string.isRequired,
  show: PropTypes.bool.isRequired,
  warningMessage: PropTypes.string,
  close: PropTypes.func.isRequired,
  deleteItem: PropTypes.func.isRequired,
};

export default withStyles(styles)(ListDeleteModal);
