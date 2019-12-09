import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import { Typography } from '@material-ui/core'
import ThreadReply from './thread-reply'
import ThreadMessages from './thread-messages'

const styles = theme => ({
  wrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    textAlign: 'center',
    fontWeight: 600,
    padding: `${theme.spacing.unit * 2}px 0`,
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
  },
})

class ThreadContent extends Component {
  renderContent = () => {
    const { classes, thread } = this.props

    if (!thread) {
      return null
    }

    return (
      <Fragment>
        <Typography variant="h5" className={classes.title}>
          {thread.title} - {thread.id}
        </Typography>
        <ThreadMessages messages={thread.messages} />
        <ThreadReply />
      </Fragment>
    )
  }

  render() {
    const { classes } = this.props

    return (
      <div className={classes.wrapper}>
        {this.renderContent()}
      </div>
    )
  }
}

ThreadContent.propTypes = {
  classes: PropTypes.object,
  thread: PropTypes.object,
}

export default withStyles(styles)(ThreadContent)
