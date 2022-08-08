import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';
import Joyride from 'react-joyride';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import CircularProgress from '@material-ui/core/CircularProgress';
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
import { PIPELINE_TUTORIAL_STEPS } from '../../constants/tutorial';

const DashboardNav = ({
  user, hasRunOfInterestInProgress, showPipelineTutorial, pipelineTutorialChange,
}, { router }) => (
  <Fragment>
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
        <ListItemText primary="Maps local data" id="maps-menu" />
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
        <ListItem button component={Link} to="/dashboard/permissions">
          <ListItemIcon><SecurityIcon /></ListItemIcon>
          <ListItemText primary="Permissions" />
        </ListItem>
      )}
      {(isAdmin(user)) && (
        <ListItem button component={Link} to="/dashboard/pipeline-states">
          <ListItemIcon><AssignmentIcon /></ListItemIcon>
          <ListItemText primary="Pipeline States" />
        </ListItem>
      )}
    </List>
    {showPipelineTutorial && router.location.pathname === '/dashboard' && (
      <Joyride
        steps={PIPELINE_TUTORIAL_STEPS.dashboardNav}
        disableScrollParentFix
        callback={pipelineTutorialChange}
      />
    )}
  </Fragment>
);

DashboardNav.propTypes = {
  user: PropTypes.object.isRequired,
  hasRunOfInterestInProgress: PropTypes.bool.isRequired,
  showPipelineTutorial: PropTypes.bool.isRequired,
  pipelineTutorialChange: PropTypes.func.isRequired,
};

DashboardNav.contextTypes = {
  router: PropTypes.object.isRequired,
};

export default DashboardNav;
