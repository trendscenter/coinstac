import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import TextField from '@material-ui/core/TextField';
import { withStyles } from '@material-ui/core/styles';
import ThreadReply from './thread-reply';

const styles = theme => ({
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
});

function ThreadNew({
  classes, savingStatus, onSend, startingTitle, startingRecipients,
}) {
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
  classes: PropTypes.object.isRequired,
  savingStatus: PropTypes.string,
  onSend: PropTypes.func.isRequired,
  startingTitle: PropTypes.string,
  startingRecipients: PropTypes.object,
};

export default withStyles(styles)(ThreadNew);
