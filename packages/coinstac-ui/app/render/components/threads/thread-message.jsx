import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';
import { withStyles } from '@material-ui/core/styles';
import ThreadAvatar from './thread-avatar';

const styles = theme => ({
  wrapper: {
    borderTop: `1px solid ${theme.palette.grey[300]}`,
    padding: theme.spacing.unit * 2,
  },
  users: {
    display: 'flex',
    alignItems: 'center',
    paddingBottom: theme.spacing.unit * 2,
    borderBottom: '1px solid #f3f2f1',
    '&>span': {
      fontWeight: 600,
    },
  },
  to: {
    paddingLeft: theme.spacing.unit,
  },
  avatarWrapper: {
    paddingLeft: theme.spacing.unit * 1.5,
    paddingRight: theme.spacing.unit,
  },
  button: {
    padding: theme.spacing.unit,
    backgroundColor: '#0078d4',
    fontSize: 12,
    color: 'white',
    cursor: 'pointer',
    border: 0,
    borderRadius: 4,
    outline: 'none',
    '&:hover': {
      backgroundColor: '#005a9e',
    },
  },
});

const ThreadMessage = ({ classes, message, joinConsortium }) => {
  const {
    sender, recipients, content, action,
  } = message;

  return (
    <div className={classes.wrapper}>
      <div className={classes.users}>
        <span>From:</span>
        <div className={classes.avatarWrapper}>
          <ThreadAvatar
            username={sender.username}
            showUsername
          />
        </div>
        <span className={classes.to}>To:</span>
        {
          Object.keys(recipients).map(userId => (
            <div
              className={classes.avatarWrapper}
              key={userId}
            >
              <ThreadAvatar
                username={recipients[userId]}
                showUsername
                isSender={false}
              />
            </div>
          ))
        }
      </div>
      <p>
        {content}
      </p>
      {action && action.type === 'join-consortium' && (
        <button
          type="button"
          className={classes.button}
          onClick={() => joinConsortium(action.detail.id)}
        >
          {`Join consortium - ${action.detail.name}`}
        </button>
      )}

      {action && action.type === 'share-result' && (
        <Link to="/dashboard/results">
          <button type="button" className={classes.button}>See Result</button>
        </Link>
      )}
    </div>
  );
};

ThreadMessage.propTypes = {
  classes: PropTypes.object.isRequired,
  message: PropTypes.object.isRequired,
  joinConsortium: PropTypes.func.isRequired,
};

export default withStyles(styles)(ThreadMessage);
