import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import IconButton from '@material-ui/core/IconButton';
import Fab from '@material-ui/core/Fab';
import Typography from '@material-ui/core/Typography';
import CloseIcon from '@material-ui/icons/Close';
import ThumbDownIcon from '@material-ui/icons/ThumbDown';
import ThumbUpIcon from '@material-ui/icons/ThumbUp';
import PropTypes from 'prop-types';

const useStyles = makeStyles(theme => ({
  root: {
    margin: 0,
    padding: theme.spacing(2),
  },
  closeButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: theme.palette.grey[500],
  },
  content: {
    padding: theme.spacing(2),
  },
  requestRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowActions: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
}));

const ConsortiaJoinDialog = ({
  joinRequests,
  onApproveRequest,
  onRejectRequest,
  onClose,
}) => {
  const classes = useStyles();

  return (
    <Dialog open maxWidth="xs" fullWidth onClose={onClose}>
      <DialogTitle disableTypography className={classes.root}>
        <Typography variant="h6">Consortium Join Request(s)</Typography>
        {onClose && (
          <IconButton className={classes.closeButton} onClick={onClose}>
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>
      <DialogContent dividers className={classes.content}>
        {joinRequests.map((joinRequest, idx) => (
          <Box
            key={`${joinRequest.consortium.id}-${joinRequest.user.id}`}
            className={classes.requestRow}
            paddingTop={idx === 0 ? 0 : 1}
            paddingBottom={idx === joinRequests.length - 1 ? 0 : 1}
            borderBottom={idx < joinRequests.length - 1 ? '1px solid #d9d9d9' : 'none'}
          >
            <Box fontSize={16}>
              <b>{joinRequest.user.username}</b>
              &nbsp;to join&nbsp;
              <b>{joinRequest.consortium.name}</b>
            </Box>
            <Box className={classes.rowActions}>
              <Fab
                color="primary"
                size="small"
                onClick={() => onApproveRequest(joinRequest)}
              >
                <ThumbUpIcon />
              </Fab>
              <Fab
                color="secondary"
                size="small"
                onClick={() => onRejectRequest(joinRequest)}
              >
                <ThumbDownIcon />
              </Fab>
            </Box>
          </Box>
        ))}
      </DialogContent>
    </Dialog>
  );
};

ConsortiaJoinDialog.propTypes = {
  joinRequests: PropTypes.arrayOf(PropTypes.shape({
    consortium: PropTypes.shape({ id: PropTypes.string, name: PropTypes.string }),
    user: PropTypes.shape({ id: PropTypes.string, username: PropTypes.string }),
  })).isRequired,
  onApproveRequest: PropTypes.func.isRequired,
  onRejectRequest: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ConsortiaJoinDialog;
