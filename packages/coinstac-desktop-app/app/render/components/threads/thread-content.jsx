import React from 'react';
import PropTypes from 'prop-types';
import makeStyles from '@material-ui/core/styles/makeStyles';
import Typography from '@material-ui/core/Typography';
import ThreadReply from './thread-reply';
import ThreadMessages from './thread-messages';

const useStyles = makeStyles(theme => ({
  wrapper: {
    width: 'calc(100% - 250px)',
    display: 'flex',
    flexDirection: 'column',
    [theme.breakpoints.down('sm')]: {
      width: 'calc(100% - 180px)',
    },
  },
  title: {
    textAlign: 'center',
    fontWeight: 600,
    padding: `${theme.spacing(2)}px 0`,
  },
}));

const ThreadContent = ({
  savingStatus, thread, onSend, onJoinConsortium,
}) => {
  const classes = useStyles();

  function renderContent() {
    if (!thread) {
      return null;
    }

    return (
      <>
        <Typography variant="h5" className={classes.title}>
          {thread.title}
        </Typography>
        <ThreadMessages
          messages={thread.messages}
          joinConsortium={onJoinConsortium}
        />
        <ThreadReply
          threadId={thread.id}
          threadUsers={thread.users}
          title={thread.title}
          savingStatus={savingStatus}
          onSend={onSend}
        />
      </>
    );
  }

  return (
    <div className={classes.wrapper}>
      {renderContent()}
    </div>
  );
};

ThreadContent.defaultProps = {
  thread: null,
};

ThreadContent.propTypes = {
  savingStatus: PropTypes.string.isRequired,
  thread: PropTypes.object,
  onJoinConsortium: PropTypes.func.isRequired,
  onSend: PropTypes.func.isRequired,
};

export default ThreadContent;
