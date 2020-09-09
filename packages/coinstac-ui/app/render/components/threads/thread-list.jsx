import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { get, orderBy } from 'lodash';
import { withStyles } from '@material-ui/core/styles';
import ThreadCard from './thread-card';
import { ThreadContext } from './context';

const styles = theme => ({
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 250,
    borderRight: `1px solid ${theme.palette.grey[300]}`,
    [theme.breakpoints.down('sm')]: {
      minWidth: 180,
    },
  },
  threads: {
    flex: 1,
    overflow: 'auto',
    backgroundColor: '#f3f2f1',
  },
  button: {
    width: '100%',
    padding: `${theme.spacing(2)}px 0`,
    backgroundColor: '#0078d4',
    fontSize: 14,
    color: 'white',
    cursor: 'pointer',
    border: 0,
    outline: 'none',
    '&:hover': {
      backgroundColor: '#005a9e',
    },
  },
});

class ThreadList extends Component {
  isThreadUnread = (thread) => {
    const { auth } = this.context;
    const user = thread.users[auth.user.id];

    return !get(user, 'isRead', true);
  }

  render() {
    const {
      classes, selectedThread, onThreadClick, onThreadNewClick,
    } = this.props;
    const { threads } = this.context;

    return (
      <div className={classes.wrapper}>
        <div className={classes.threads}>
          {orderBy(threads, 'date', 'desc').map(thread => (
            <ThreadCard
              key={thread.id}
              thread={thread}
              isSelected={thread.id === selectedThread}
              isUnread={this.isThreadUnread(thread)}
              onClick={() => onThreadClick(thread.id)}
            />))}
        </div>
        <button
          type="button"
          className={classes.button}
          onClick={onThreadNewClick}
        >
          New Message
        </button>
      </div>
    );
  }
}

ThreadList.defaultProps = {
  selectedThread: null,
};

ThreadList.propTypes = {
  classes: PropTypes.object.isRequired,
  selectedThread: PropTypes.any,
  onThreadClick: PropTypes.func.isRequired,
  onThreadNewClick: PropTypes.func.isRequired,
};

ThreadList.contextType = ThreadContext;

export default withStyles(styles)(ThreadList);
