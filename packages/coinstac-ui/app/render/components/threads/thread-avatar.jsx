import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { get, toUpper } from 'lodash'
import { Avatar } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'

const styles = theme => ({
  wrapper: {
    display: 'flex',
    alignItems: 'center',
  },
  avatar: {
    width: 28,
    height: 28,
    fontSize: 14,
    '&.sender': {
      backgroundColor: '#0078d4',
    },
    '&.receiver': {
      backgroundColor: '#c239B3',
    },
  },
  username: {
    paddingLeft: theme.spacing.unit,
  }
})

const ThreadAvatar = ({
  classes,
  className,
  username,
  showUsername,
  isSender,
  ...otherProps,
}) => (
  <div className={classes.wrapper}>
    <Avatar
      className={
        classNames(
          className || classes.avatar,
          { sender: isSender, receiver: !isSender },
        )
      }
      {...otherProps}
    >
      {toUpper(get(username, '0'))}
    </Avatar>
    <span className={classes.username}>{showUsername && username}</span>
  </div>
)

ThreadAvatar.propTypes = {
  classes: PropTypes.object,
  className: PropTypes.any,
  isSender: PropTypes.bool,
  username: PropTypes.string,
  showUsername: PropTypes.bool,
}

ThreadAvatar.defaultProps = {
  isSender: true,
  showUsername: false,
}

export default withStyles(styles)(ThreadAvatar)
