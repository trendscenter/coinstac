import React from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import WarningIcon from '@material-ui/icons/Warning';
import makeStyles from '@material-ui/core/styles/makeStyles';

const useStyles = makeStyles(theme => ({
  warningMessageContainer: {
    display: 'flex',
    alignItems: 'center',
    marginTop: theme.spacing(2),
  },
  warningMessage: {
    marginTop: theme.spacing(0.5),
    marginLeft: theme.spacing(0.5),
  },
}));

const ListDeleteModal = ({
  close,
  deleteItem,
  itemName,
  show,
  warningMessage,
}) => {
  const classes = useStyles();

  return (
    <Dialog id="list-delete-modal" open={show} onClose={close}>
      <DialogTitle>
        Delete
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          {`Are you sure you want to delete this ${itemName}?`}
        </DialogContentText>
        {warningMessage && (
          <div className={classes.warningMessageContainer}>
            <WarningIcon />
            <DialogContentText className={classes.warningMessage}>
              {warningMessage}
            </DialogContentText>
          </div>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={close}>Cancel</Button>
        <Button color="primary" onClick={deleteItem}>Delete</Button>
      </DialogActions>
    </Dialog>
  );
};

ListDeleteModal.defaultProps = {
  warningMessage: null,
};

ListDeleteModal.propTypes = {
  itemName: PropTypes.string.isRequired,
  show: PropTypes.bool.isRequired,
  warningMessage: PropTypes.string,
  close: PropTypes.func.isRequired,
  deleteItem: PropTypes.func.isRequired,
};

export default ListDeleteModal;
