import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { TextField } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import ThreadReply from './thread-reply';

const styles = theme => ({
  wrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
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

class ThreadNew extends Component {
  state = {
    title: '',
  }

  handleTitleChange = (evt) => {
    this.setState({ title: evt.target.value });
  }

  render() {
    const { classes, savingStatus, onSend } = this.props;
    const { title } = this.state;

    return (
      <div className={classes.wrapper}>
        <div className={classes.title}>
          <TextField
            className={classes.input}
            value={title}
            label="Title"
            variant="outlined"
            onChange={this.handleTitleChange}
          />
        </div>
        <div style={{ flex: 1 }} />
        <ThreadReply
          title={title}
          savingStatus={savingStatus}
          onSend={onSend}
        />
      </div>
    );
  }
}

ThreadNew.defaultProps = {
  savingStatus: 'init',
};

ThreadNew.propTypes = {
  classes: PropTypes.object.isRequired,
  savingStatus: PropTypes.string,
  onSend: PropTypes.func.isRequired,
};

export default withStyles(styles)(ThreadNew);
