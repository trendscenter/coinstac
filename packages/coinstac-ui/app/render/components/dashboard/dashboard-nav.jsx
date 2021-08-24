import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import HomeIcon from '@material-ui/icons/Home';
import StorageIcon from '@material-ui/icons/Storage';
import ViewListIcon from '@material-ui/icons/ViewList';
import ListAltIcon from '@material-ui/icons/ListAlt';
import AssignmentIcon from '@material-ui/icons/Assignment';
import EqualizerIcon from '@material-ui/icons/Equalizer';
import DescriptionIcon from '@material-ui/icons/Description';
import CloudIcon from '@material-ui/icons/Cloud';
import SecurityIcon from '@material-ui/icons/Security';
import LanguageIcon from '@material-ui/icons/Language';
import { isAdmin, isOwnerOfAnyHeadlessClient } from '../../utils/helpers';

const DashboardNav = ({ user }) => {
  return (
    <List className="mainnav">
      <ListItem button component="a" href="#/dashboard">
        <ListItemIcon><HomeIcon /></ListItemIcon>
        <ListItemText primary="Home" />
      </ListItem>
      <ListItem button component="a" href="#/dashboard/maps">
        <ListItemIcon><ListAltIcon /></ListItemIcon>
        <ListItemText primary="Maps" />
      </ListItem>
      <ListItem button component="a" href="#/dashboard/computations">
        <ListItemIcon><StorageIcon /></ListItemIcon>
        <ListItemText primary="Computations" />
      </ListItem>
      <ListItem button component="a" href="#/dashboard/consortia">
        <ListItemIcon><ViewListIcon /></ListItemIcon>
        <ListItemText primary="Consortia" />
      </ListItem>
      <ListItem button component="a" href="#/dashboard/pipelines">
        <ListItemIcon><AssignmentIcon /></ListItemIcon>
        <ListItemText primary="Pipelines" />
      </ListItem>
      <ListItem button component="a" href="#/dashboard/results">
        <ListItemIcon><EqualizerIcon /></ListItemIcon>
        <ListItemText primary="Results" />
      </ListItem>
      <ListItem button component={Link} to="/dashboard/logs">
        <ListItemIcon><DescriptionIcon /></ListItemIcon>
        <ListItemText primary="Logs" />
      </ListItem>
      <ListItem button component={Link} to="/dashboard/data-discovery">
        <ListItemIcon><LanguageIcon /></ListItemIcon>
        <ListItemText primary="Data Discovery" />
      </ListItem>
      {(isAdmin(user) || isOwnerOfAnyHeadlessClient(user)) && (
        <ListItem button component={Link} to="/dashboard/headlessClients">
          <ListItemIcon><CloudIcon /></ListItemIcon>
          <ListItemText primary="Cloud Users" />
        </ListItem>
      )}
      {isAdmin(user) && (
        <ListItem button component={Link} to="/dashboard/permissions">
          <ListItemIcon><SecurityIcon /></ListItemIcon>
          <ListItemText primary="Permissions" />
        </ListItem>
      )}
    </List>
  );
};

DashboardNav.propTypes = {
  user: PropTypes.object.isRequired,
};

export default DashboardNav;
