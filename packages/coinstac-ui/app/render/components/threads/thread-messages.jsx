import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import ThreadMessage from './thread-message'

const styles = theme => ({
  wrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
  }
})

class ThreadMessages extends Component {
  render() {
    const { classes, messages } = this.props

    return (
      <div className={classes.wrapper}>
        {messages.map(message => (
          <ThreadMessage key={message.id} message={message} />
        ))}
      </div>
    )
  }
}

ThreadMessages.propTypes = {
  classes: PropTypes.object,
}

export default withStyles(styles)(ThreadMessages)
