import { useSelector } from 'react-redux';
import React from 'react';
import { Link } from 'react-router';
import PropTypes from 'prop-types';
import makeStyles from '@material-ui/core/styles/makeStyles';
import Badge from '@material-ui/core/Badge';
import Typography from '@material-ui/core/Typography';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import SettingsIcon from '@material-ui/icons/Settings';
import BugReportIcon from '@material-ui/icons/BugReport';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import MessageIcon from '@material-ui/icons/Message';
import MemberAvatar from '../common/member-avatar';

const useStyles = makeStyles(() => ({
  root: {
    display: 'flex',
  },
  textContainer: {
    marginLeft: '0.5rem',
  },
  listRoot: {
    padding: 0,
  },
  listItemRoot: {
    padding: '0.2rem 0',
  },
  listItemButtonTextRoot: {
    paddingLeft: 0,
  },
  userPhoto: {
    width: '40px',
    height: '40px',
    marginTop: '5px',
  },
}));

const UserAccount = ({ unreadThreadCount, logoutUser }) => {
  const auth = useSelector(state => state.auth);

  const classes = useStyles();

  if (!auth || !auth.user) {
    return <div className={classes.root} />;
  }

  const { id, username, email } = auth.user;

  return (
    <div className={classes.root}>
      <MemberAvatar
        consRole="Member"
        id={id}
        name={username}
        width={40}
      />
      <div className={classes.textContainer}>
        <List classes={{ root: classes.listRoot }}>
          <ListItem
            disableGutters
            classes={{
              root: classes.listItemRoot,
            }}
          >
            <ListItemText disableTypography>
              <Typography variant="subtitle2" className="user-account-name">
                {username}
              </Typography>
            </ListItemText>
          </ListItem>
          <ListItem disableGutters classes={{ root: classes.listItemRoot }}>
            <ListItemText disableTypography>
              <Typography variant="caption">
                {email}
              </Typography>
            </ListItemText>
          </ListItem>
          <ListItem disableGutters button component={Link} to="/dashboard/threads">
            <ListItemIcon>
              <Badge className={classes.margin} badgeContent={unreadThreadCount} color="secondary">
                <MessageIcon />
              </Badge>
            </ListItemIcon>
            <ListItemText
              primary="Messages"
              classes={{ root: classes.listItemButtonTextRoot }}
            />
          </ListItem>
          <ListItem disableGutters button component={Link} to="/dashboard/settings">
            <ListItemIcon><SettingsIcon /></ListItemIcon>
            <ListItemText
              primary="Settings"
              classes={{ root: classes.listItemButtonTextRoot }}
            />
          </ListItem>
          <ListItem disableGutters button component={Link} to="/dashboard/issues">
            <ListItemIcon><BugReportIcon /></ListItemIcon>
            <ListItemText
              primary="Submit a bug"
              classes={{ root: classes.listItemButtonTextRoot }}
            />
          </ListItem>
          <ListItem disableGutters button component={Link} to="/login" onClick={logoutUser}>
            <ListItemIcon><ExitToAppIcon /></ListItemIcon>
            <ListItemText
              primary="Log Out"
              classes={{ root: classes.listItemButtonTextRoot }}
            />
          </ListItem>
        </List>
      </div>
    </div>
  );
};

UserAccount.displayName = 'UserAccount';

UserAccount.propTypes = {
  unreadThreadCount: PropTypes.number.isRequired,
  logoutUser: PropTypes.func.isRequired,
};

export default UserAccount;
