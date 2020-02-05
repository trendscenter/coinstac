import React from 'react'
import PropTypes from 'prop-types'
import { get, orderBy } from 'lodash'
import { withStyles } from '@material-ui/core/styles'
import ThreadCard from './thread-card'

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
})

const ThreadList = ({ userId, classes, threads, selectedThread, onThreadClick, onThreadNewClick }) => {
  function isThreadUnread(thread) {
    const user = thread.users.find(({ username }) => username === userId)

    return !get(user, 'isRead', true);
  }

  return (
    <div className={classes.wrapper}>
      <div className={classes.threads}>
        {orderBy(threads, 'date', 'desc').map(thread => (
          <ThreadCard
            key={thread.id}
            thread={thread}
            isSelected={thread.id === selectedThread}
            isUnread ={isThreadUnread(thread)}
            onClick={() => onThreadClick(thread.id)}
          />)
        )}
      </div>
      <button
        className={classes.button}
        onClick={onThreadNewClick}
      >
        New Message
      </button>
    </div>
  )
}

ThreadList.propTypes = {
  userId: PropTypes.string.isRequired,
  classes: PropTypes.object.isRequired,
  threads: PropTypes.array,
  selectedThread: PropTypes.any,
  onThreadClick: PropTypes.func.isRequired,
  onThreadNewClick: PropTypes.func.isRequired,
}

export default withStyles(styles)(ThreadList)
