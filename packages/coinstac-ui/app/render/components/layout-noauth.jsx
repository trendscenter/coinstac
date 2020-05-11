import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';
import classNames from 'classnames';
import { MuiThemeProvider, withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import theme from '../styles/material-ui/theme';
import CoinstacAbbr from './coinstac-abbr';

const styles = theme => ({
  navButtonsContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: theme.spacing.unit * 2,
  },
  navButton: {
    paddingLeft: theme.spacing.unit * 4,
    paddingRight: theme.spacing.unit * 4,
  },
  lastNavButton: {
    marginLeft: theme.spacing.unit * 2,
  },
});

function LayoutNoAuth({ children, classes }) {
  return (
    <MuiThemeProvider theme={theme}>
      <div className="screen account">
        <div className="container-fluid">
          <div className="row">
            <div className="col-xs-12 col-sm-6 col-sm-offset-3 col-md-4 col-md-offset-4">
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </MuiThemeProvider>
  );
}

LayoutNoAuth.displayName = 'LayoutNoAuth';

LayoutNoAuth.propTypes = {
  children: PropTypes.node.isRequired,
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(LayoutNoAuth);
