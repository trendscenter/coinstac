import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { get, head, orderBy, toUpper } from 'lodash';
import { Avatar } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import ThreadAvatar from './thread-avatar';

const styles = () => ({
  wrapper: {
    display: 'flex',
    marginBottom: 1,
    padding: '9px 0 12px 0',
    color: '#605e5c',
    fontSize: 14,
    backgroundColor: 'white',
    cursor: 'pointer',
    lineHeight: '19px',
    '&.unRead': {
      borderLeft: '4px solid #0078d4'
    },
    '&.selected': {
      backgroundColor: '#cfe0f4',
    },
    '&:hover': {
      backgroundColor: '#edebe9',
    }
  },
  avatarWrapper: {
    padding: '6px 12px 0 8px',
  },
  username: {
    color: '#201f1e',
    '&.unRead': {
      fontWeight: 600,
    }
  },
  title: {
    '&.unRead': {
      color: '#0078d4',
      fontWeight: 600,
    }
  }
});

class ThreadCard extends Component {
  getContent = () => {
    const { thread } = this.props;

    const messages = orderBy(thread.messages, 'date', 'desc');
    const firstMessage = head(messages);

    return get(firstMessage, 'content', '');
  }

  render() {
    const { classes, thread, isSelected } = this.props;

    return (
      <div
        className={classNames(classes.wrapper, {
          selected: isSelected,
          unRead: !thread.isRead,
        })}
        onClick={this.props.onClick}
      >
        <div className={classes.avatarWrapper}>
          <ThreadAvatar username={thread.owner} />
        </div>
        <div>
          <div className={classNames(classes.owner, { unRead: !thread.isRead })}>{thread.owner}</div>
          <div className={classNames(classes.title, { unRead : !thread.isRead })}>{thread.title}</div>
          <div>{this.getContent()}</div>
        </div>
      </div>
    );
  }
}

ThreadCard.propTypes = {
  isSelected: PropTypes.bool,
  thread: PropTypes.shape({
    owner: PropTypes.string,
    title: PropTypes.string,
    content: PropTypes.string,
  }),
  onClick: PropTypes.func,
}

export default withStyles(styles)(ThreadCard);
