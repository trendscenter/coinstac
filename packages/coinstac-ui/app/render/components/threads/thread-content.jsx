import React, { Fragment } from 'react'
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

const ThreadContent = ({ classes, thread, savingStatus, onSend }) => {
  function renderContent() {
    if (!thread) {
      return null
    }

    return (
      <Fragment>
        <Typography variant="h5" className={classes.title}>
          {thread.title}
        </Typography>
        <ThreadMessages messages={thread.messages} />
        <ThreadReply
          threadId={thread.id}
          title={thread.title}
          savingStatus={savingStatus}
          onSend={onSend}
        />
      </Fragment>
    )
  }

  return (
    <div className={classes.wrapper}>
      {renderContent()}
    </div>
  )
}

ThreadContent.propTypes = {
  classes: PropTypes.object.isRequired,
  thread: PropTypes.object,
  savingStatus: PropTypes.string.isRequired,
  onSend: PropTypes.func.isRequired,
}

export default withStyles(styles)(ThreadContent)
