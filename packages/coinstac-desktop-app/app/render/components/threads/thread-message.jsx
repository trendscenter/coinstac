import makeStyles from '@material-ui/core/styles/makeStyles';
import PropTypes from 'prop-types';
import React from 'react';
import { Link } from 'react-router';

import ThreadAvatar from './thread-avatar';

const useStyles = makeStyles(theme => ({
  wrapper: {
    borderTop: `1px solid ${theme.palette.grey[300]}`,
    padding: theme.spacing(2),
  },
  users: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingBottom: theme.spacing(2),
    borderBottom: '1px solid #f3f2f1',
    '&>span': {
      fontWeight: 600,
    },
  },
  to: {
    paddingLeft: theme.spacing(1),
  },
  avatarWrapper: {
    paddingLeft: theme.spacing(1.5),
    paddingRight: theme.spacing(1),
  },
  button: {
    padding: theme.spacing(1),
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
  fromTo: {
    display: 'flex',
    alignItems: 'center',
    padding: `${theme.spacing(1) / 2}px 0`,
  },
}));

const ThreadMessage = ({ message, joinConsortium }) => {
  const classes = useStyles();

  const {
    sender, recipients, content, action,
  } = message;

  return (
    <div className={classes.wrapper}>
      <div className={classes.users}>
        <div className={classes.fromTo}>
          <span>From:</span>
          <div className={classes.avatarWrapper}>
            <ThreadAvatar
              username={sender.username}
              showUsername
            />
          </div>
        </div>
        <div className={classes.fromTo}>
          <span className={classes.to}>To:</span>
          {Object.keys(recipients).map(recipientId => (
            <div
              className={classes.avatarWrapper}
              key={recipientId}
            >
              <ThreadAvatar
                username={recipients[recipientId]}
                showUsername
                isSender={false}
              />
            </div>
          ))}
        </div>
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
  message: PropTypes.object.isRequired,
  joinConsortium: PropTypes.func.isRequired,
};

export default ThreadMessage;
