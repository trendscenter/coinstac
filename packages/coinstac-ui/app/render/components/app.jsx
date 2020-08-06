import React, { Component } from 'react';
import { findDOMNode } from 'react-dom';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { ipcRenderer } from 'electron';
import { SnackbarProvider } from 'notistack';
import { CssBaseline } from '@material-ui/core';
import { MuiThemeProvider, withStyles } from '@material-ui/core/styles';
import ActivityIndicator from './activity-indicator/activity-indicator';
import { autoLogin, logout, setError } from '../state/ducks/auth';
import { notifyWarning } from '../state/ducks/notifyAndLog';
import { EXPIRED_TOKEN, BAD_TOKEN } from '../utils/error-codes';
import theme from '../styles/material-ui/theme';

const styles = {
  success: {
    backgroundColor: '#43a047 !important',
    color: '#fff !important',
  },
  error: {
    backgroundColor: '#d32f2f !important',
    color: '#fff !important',
  },
  warning: {
    backgroundColor: '#ff9800 !important',
    color: '#fff !important',
  },
  info: {
    backgroundColor: '#2196f3 !important',
    color: '#fff !important',
  },
};

class App extends Component {
  constructor(props) {
    super(props);

    this.state = { checkJWT: false };

    this.transitionSplashScreenIntoApp = this.transitionSplashScreenIntoApp.bind(this);
  }

  componentDidMount() {
    const {
      autoLogin,
      setError,
      logout,
      router,
      notifyWarning,
    } = this.props;

    // Remove splash screen
    setTimeout(this.transitionSplashScreenIntoApp, 1000);

    autoLogin()
      .then(() => {
        this.setState({ checkJWT: true });
      });

    ipcRenderer.on(EXPIRED_TOKEN, () => {
      setError(EXPIRED_TOKEN);
      logout();
      router.push('/login');
    });

    ipcRenderer.on(BAD_TOKEN, () => {
      notifyWarning('Bad token used on a request');
    });
  }

  componentWillUnmount() {
    ipcRenderer.removeAllListeners(EXPIRED_TOKEN);
  }

  transitionSplashScreenIntoApp() {
    const splashComponent = document.getElementById('splash-component');
    splashComponent.className = 'fade-out';

    // eslint-disable-next-line react/no-find-dom-node
    const appComponent = findDOMNode(this);
    appComponent.className = 'app fade-in';

    setTimeout(() => splashComponent.parentNode.removeChild(splashComponent), 500);
  }

  render() {
    const { children, loading: { isLoading }, classes } = this.props;

    const { checkJWT } = this.state;

    return (
      <div className="app">
        <MuiThemeProvider theme={theme}>
          <CssBaseline />
          <ActivityIndicator visible={isLoading} />

          <SnackbarProvider
            maxSnack={3}
            classes={{
              variantSuccess: classes.success,
              variantError: classes.error,
              variantWarning: classes.warning,
              variantInfo: classes.info,
            }}
          >
            { checkJWT && children }
          </SnackbarProvider>
        </MuiThemeProvider>
      </div>
    );
  }
}

App.displayName = 'App';

App.propTypes = {
  children: PropTypes.node.isRequired,
  loading: PropTypes.object.isRequired,
  router: PropTypes.object.isRequired,
  autoLogin: PropTypes.func.isRequired,
  logout: PropTypes.func.isRequired,
  notifyWarning: PropTypes.func.isRequired,
  setError: PropTypes.func.isRequired,
  classes: PropTypes.object.isRequired,
};

const mapStateToProps = ({ loading }) => ({
  loading,
});

const connectedApp = connect(mapStateToProps, {
  autoLogin,
  logout,
  setError,
  notifyWarning,
})(App);

export default withStyles(styles)(connectedApp);
