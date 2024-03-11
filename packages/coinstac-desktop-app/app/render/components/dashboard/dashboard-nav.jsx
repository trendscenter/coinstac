import CircularProgress from '@material-ui/core/CircularProgress';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import AssignmentIcon from '@material-ui/icons/Assignment';
import CloudIcon from '@material-ui/icons/Cloud';
import DescriptionIcon from '@material-ui/icons/Description';
import EqualizerIcon from '@material-ui/icons/Equalizer';
import HomeIcon from '@material-ui/icons/Home';
import LanguageIcon from '@material-ui/icons/Language';
import ListAltIcon from '@material-ui/icons/ListAlt';
import StorageIcon from '@material-ui/icons/Storage';
import SupervisorAccountIcon from '@material-ui/icons/SupervisorAccount';
import ViewListIcon from '@material-ui/icons/ViewList';
import PropTypes from 'prop-types';
import React from 'react';
import Joyride from 'react-joyride';
import { Link } from 'react-router';

import { TUTORIAL_STEPS } from '../../constants';
import { isAdmin, isOwnerOfAnyHeadlessClient } from '../../utils/helpers';

const DashboardNav = ({
  user, hasRunOfInterestInProgress, isTutorialHidden, tutorialChange,
}, { router }) => (
  <>
    <List className="mainnav">
      <ListItem button component="a" href="#/dashboard">
        <ListItemIcon><HomeIcon /></ListItemIcon>
        <ListItemText primary="Home" />
        {hasRunOfInterestInProgress && <CircularProgress disableShrink size={20} />}
      </ListItem>
      <ListItem button component="a" href="#/dashboard/consortia">
        <ListItemIcon><ViewListIcon /></ListItemIcon>
        <ListItemText primary="Consortia" id="consortia-menu" />
      </ListItem>
      <ListItem button component="a" href="#/dashboard/pipelines">
        <ListItemIcon><AssignmentIcon /></ListItemIcon>
        <ListItemText primary="Pipelines" />
      </ListItem>
      <ListItem button component="a" href="#/dashboard/maps">
        <ListItemIcon><ListAltIcon /></ListItemIcon>
        <ListItemText primary="Map local data" id="maps-menu" />
      </ListItem>
      <ListItem button component="a" href="#/dashboard/results">
        <ListItemIcon><EqualizerIcon /></ListItemIcon>
        <ListItemText primary="Results" />
      </ListItem>
      <ListItem button component="a" href="#/dashboard/computations">
        <ListItemIcon><StorageIcon /></ListItemIcon>
        <ListItemText primary="Computations" />
      </ListItem>
      <ListItem button component={Link} to="/dashboard/data-discovery">
        <ListItemIcon><LanguageIcon /></ListItemIcon>
        <ListItemText primary="Data Discovery" />
      </ListItem>
      <ListItem button component={Link} to="/dashboard/logs">
        <ListItemIcon><DescriptionIcon /></ListItemIcon>
        <ListItemText primary="Logs" />
      </ListItem>
      {(isAdmin(user) || isOwnerOfAnyHeadlessClient(user)) && (
        <ListItem button component={Link} to="/dashboard/headlessClients">
          <ListItemIcon><CloudIcon /></ListItemIcon>
          <ListItemText primary="Vault Users" />
        </ListItem>
      )}
      {isAdmin(user) && (
        <ListItem button component={Link} to="/dashboard/admin">
          <ListItemIcon><SupervisorAccountIcon /></ListItemIcon>
          <ListItemText primary="Admin" />
        </ListItem>
      )}
    </List>
    {!isTutorialHidden && router.location.pathname === '/dashboard' && (
      <Joyride
        steps={TUTORIAL_STEPS.dashboardNav}
        disableScrollParentFix
        callback={tutorialChange}
      />
    )}
  </>
);

DashboardNav.propTypes = {
  user: PropTypes.object.isRequired,
  hasRunOfInterestInProgress: PropTypes.bool.isRequired,
  isTutorialHidden: PropTypes.bool.isRequired,
  tutorialChange: PropTypes.func.isRequired,
};

DashboardNav.contextTypes = {
  router: PropTypes.object.isRequired,
};

export default DashboardNav;
