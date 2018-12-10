import { Button } from 'react-bootstrap';
import { connect } from 'react-redux';
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import SettingsIcon from '@material-ui/icons/Settings';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import MemberAvatar from '../common/member-avatar';

const styles = {
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
};

const UserAccount = (props) => {
  const { logoutUser, auth, classes } = props;

  if (!auth || !auth.user) {
    return <div className={classes.root} />;
  }

  const { id, label, email } = auth.user;

  return (
    <div className={classes.root}>
      <MemberAvatar
        consRole="Member"
        name={id}
        width={40}
      />
      <div className={classes.textContainer}>
        <List
          classes={{
            root: classes.listRoot,
          }}
        >
          <ListItem
            disableGutters
            classes={{
              root: classes.listItemRoot,
            }}
          >
            <ListItemText disableTypography>
              <Typography variant="subtitle2">
                { label }
              </Typography>
            </ListItemText>
          </ListItem>
          <ListItem
            disableGutters
            classes={{
              root: classes.listItemRoot,
            }}
          >
            <ListItemText disableTypography>
              <Typography variant="caption">
                { email }
              </Typography>
            </ListItemText>
          </ListItem>
          <ListItem disableGutters button component="a" href="#/dashboard/settings">
            <ListItemIcon><SettingsIcon /></ListItemIcon>
            <ListItemText
              primary="Settings"
              classes={{
                root: classes.listItemButtonTextRoot,
              }}
            />
          </ListItem>
          <ListItem disableGutters button component="a" href="#/login" onClick={logoutUser}>
            <ListItemIcon><ExitToAppIcon /></ListItemIcon>
            <ListItemText
              primary="Log Out"
              classes={{
                root: classes.listItemButtonTextRoot,
              }}
            />
          </ListItem>
        </List>
      </div>
    </div>
  );
};

UserAccount.displayName = 'UserAccount';

UserAccount.propTypes = {
  logoutUser: PropTypes.func.isRequired,
  auth: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
};

const mapStateToProps = ({ auth }) => {
  return { auth };
};

const connectedComponent = connect(mapStateToProps)(UserAccount);

export default withStyles(styles)(connectedComponent);
