import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import ThreadAvatar from './thread-avatar'

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
})

class ThreadMessage extends Component {
  render() {
    const { classes, message } = this.props

    return (
      <div className={classes.wrapper}>
        <div className={classes.users}>
          <span>From:</span>
          <div className={classes.avatarWrapper}>
            <ThreadAvatar
              username={message.sender}
              showUsername
            />
          </div>
          <span className={classes.to}>To:</span>
          {message.receivers.map(receiver =>
            <div
              className={classes.avatarWrapper}
              key={receiver}
            >
              <ThreadAvatar
                username={receiver}
                showUsername
                isSender={false}
              />
            </div>
          )}
        </div>
        <p>
          {message.content}
        </p>
      </div>
    )
  }
}

ThreadMessage.propTypes = {
  classes: PropTypes.object,
}

export default withStyles(styles)(ThreadMessage)
