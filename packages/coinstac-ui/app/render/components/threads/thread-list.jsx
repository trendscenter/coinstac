import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { orderBy } from 'lodash';
import { withStyles } from '@material-ui/core/styles';
import ThreadCard from './thread-card';

const styles = theme => ({
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    width: 250,
    borderRight: `1px solid ${theme.palette.grey[300]}`,
  }, 
  threads: {
    flex: 1,
    overflow: 'auto',
    backgroundColor: '#f3f2f1',
  },
  button: {
    width: '100%',
    padding: `${theme.spacing.unit * 2}px 0`,
    backgroundColor: '#0078d4',
    fontSize: 14,
    color: 'white',
    cursor: 'pointer',
    border: 0,
    outline: 'none',
    '&:hover': {
      backgroundColor: '#005a9e',
    },
  }
});

class ThreadList extends Component {
  render() {
    const { classes, threads, selectedThread } = this.props;

    return (
      <div className={classes.wrapper}>
        <div className={classes.threads}>
          {orderBy(threads, 'updatedAt', 'desc').map(thread => (
            <ThreadCard
              key={thread.id}
              thread={thread}
              isSelected={thread.id === selectedThread}
              onClick={() => this.props.onThreadClick(thread.id)}
            />)
          )}
        </div>
        <button
          className={classes.button}
          onClick={this.props.onThreadNewClick}
        >
          New Message
        </button>
      </div>
    );
  }
}

ThreadList.propTypes = {
  classes: PropTypes.object,
  threads: PropTypes.array,
  selectedThread: PropTypes.any,
  onThreadClick: PropTypes.func,
  onThreadNewClick: PropTypes.func,
}

export default withStyles(styles)(ThreadList);
