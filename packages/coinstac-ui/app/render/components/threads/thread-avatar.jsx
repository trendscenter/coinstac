import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { get, toUpper } from 'lodash';
import Avatar from '@material-ui/core/Avatar';
import { withStyles } from '@material-ui/core/styles';

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
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
  },
});

const ThreadAvatar = ({
  classes,
  className,
  isSender,
  showUsername,
  username,
}) => (
  <div className={classes.wrapper}>
    <Avatar
      className={
        classNames(
          className || classes.avatar,
          { sender: isSender, receiver: !isSender }
        )
      }
    >
      {toUpper(get(username, '0'))}
    </Avatar>
    {showUsername && username && (
      <span className={classes.username}>{username}</span>
    )}
  </div>
);

ThreadAvatar.propTypes = {
  classes: PropTypes.object.isRequired,
  className: PropTypes.any,
  isSender: PropTypes.bool,
  showUsername: PropTypes.bool,
  username: PropTypes.string.isRequired,
};

ThreadAvatar.defaultProps = {
  className: '',
  isSender: true,
  showUsername: false,
};

export default withStyles(styles)(ThreadAvatar);
