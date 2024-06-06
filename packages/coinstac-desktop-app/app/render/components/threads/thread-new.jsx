import makeStyles from '@material-ui/core/styles/makeStyles';
import TextField from '@material-ui/core/TextField';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

import ThreadReply from './thread-reply';

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
    padding: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
  },
  input: {
    width: '100%',
  },
}));

function ThreadNew({
  savingStatus, onSend, startingTitle, startingRecipients,
}) {
  const classes = useStyles();

  const [title, setTitle] = useState('');

  function handleTitleChange(evt) {
    setTitle(evt.target.value);
  }

  useEffect(() => {
    if (startingTitle) {
      setTitle(startingTitle);
    }
  }, [startingTitle]);

  return (
    <div className={classes.wrapper}>
      <div className={classes.title}>
        <TextField
          className={classes.input}
          value={title}
          label="Title"
          variant="outlined"
          onChange={handleTitleChange}
        />
      </div>
      <div style={{ flex: 1 }} />
      <ThreadReply
        title={title}
        savingStatus={savingStatus}
        onSend={onSend}
        threadUsers={startingRecipients}
      />
    </div>
  );
}

ThreadNew.defaultProps = {
  savingStatus: 'init',
  startingTitle: null,
  startingRecipients: {},
};

ThreadNew.propTypes = {
  savingStatus: PropTypes.string,
  onSend: PropTypes.func.isRequired,
  startingTitle: PropTypes.string,
  startingRecipients: PropTypes.object,
};

export default ThreadNew;
