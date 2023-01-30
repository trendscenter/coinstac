import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import CoinstacAbbr from './coinstac-abbr';
import AutoUpdateListener from './auto-update-listener';

const styles = theme => ({
  navButtonsContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: theme.spacing(2),
  },
  navButton: {
    paddingLeft: theme.spacing(4),
    paddingRight: theme.spacing(4),
  },
  lastNavButton: {
    marginLeft: theme.spacing(2),
  },
});

function LayoutNoAuth({ children, classes }) {
  return (
    <div className="screen account">
      <div className="screen__content">
        <CoinstacAbbr />
        <div className={classes.navButtonsContainer}>
          <Button
            component={Link}
            variant="contained"
            to="/login"
            color={window.location.href.includes('/login') ? 'primary' : 'default'}
            className={classes.navButton}
          >
            Log In
          </Button>
          <Button
            component={Link}
            variant="contained"
            to="/signup"
            color={window.location.href.includes('/signup') ? 'primary' : 'default'}
            className={classNames(classes.navButton, classes.lastNavButton)}
          >
            Sign Up
          </Button>
        </div>
        {children}
        <AutoUpdateListener />
      </div>
    </div>
  );
}

LayoutNoAuth.displayName = 'LayoutNoAuth';

LayoutNoAuth.propTypes = {
  children: PropTypes.node.isRequired,
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(LayoutNoAuth);
