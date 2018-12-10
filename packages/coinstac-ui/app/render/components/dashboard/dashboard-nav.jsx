import React from 'react';
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

const DashboardNav = () => {
  return (
    <List>
      <ListItem button component="a" href="#/dashboard">
        <ListItemIcon><HomeIcon /></ListItemIcon>
        <ListItemText primary="Home" />
      </ListItem>
      <ListItem button component="a" href="#/dashboard/computations">
        <ListItemIcon><StorageIcon /></ListItemIcon>
        <ListItemText primary="Computations" />
      </ListItem>
      <ListItem button component="a" href="#/dashboard/consortia">
        <ListItemIcon><ViewListIcon /></ListItemIcon>
        <ListItemText primary="Consortia" />
      </ListItem>
      <ListItem button component="a" href="#/dashboard/collections">
        <ListItemIcon><ListAltIcon /></ListItemIcon>
        <ListItemText primary="Collections" />
      </ListItem>
      <ListItem button component="a" href="#/dashboard/pipelines">
        <ListItemIcon><AssignmentIcon /></ListItemIcon>
        <ListItemText primary="Pipelines" />
      </ListItem>
      <ListItem button component="a" href="#/dashboard/results">
        <ListItemIcon><EqualizerIcon /></ListItemIcon>
        <ListItemText primary="Results" />
      </ListItem>
    </List>
  );
};

export default DashboardNav;
