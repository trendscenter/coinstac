import React, { Component } from 'react';
import { findDOMNode } from 'react-dom';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { ipcRenderer } from 'electron';
import Notifications from 'react-notification-system-redux';
import ActivityIndicator from './activity-indicator/activity-indicator';
import { autoLogin, logout, setError } from '../state/ducks/auth';
import { notifyWarning } from '../state/ducks/notifyAndLog';
import { EXPIRED_TOKEN, BAD_TOKEN } from '../utils/error-codes';

const styles = {
  notifications: {
    NotificationItem: {
      DefaultStyle: {
        borderRadius: 0,
        border: 'none',
        opacity: 0.75,
        boxShadow: 'none',
        fontWeight: 'bold', // This might not be necessary. Use your judgement.
      },
    }
  }
};

class App extends Component { // eslint-disable-line react/prefer-stateless-function
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
      notifyWarning({ message: 'Bad token used on a request' });
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
    const { children, loading: { isLoading }, notifications } = this.props;

    const { checkJWT } = this.state;

    return (
      <div className="app">
        <ActivityIndicator visible={isLoading} />

        { checkJWT && children }

        <Notifications
          notifications={notifications}
          style={styles.notifications}
        />
      </div>
    );
  }
}

App.displayName = 'App';

App.defaultProps = {
  notifications: null,
};

App.propTypes = {
  router: PropTypes.object.isRequired,
  autoLogin: PropTypes.func.isRequired,
  logout: PropTypes.func.isRequired,
  setError: PropTypes.func.isRequired,
  notifyWarning: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  loading: PropTypes.object.isRequired,
  notifications: PropTypes.array,
};

function mapStateToProps({ loading, notifications }) {
  return {
    loading,
    notifications,
  };
}

export default connect(mapStateToProps, {
  autoLogin,
  logout,
  setError,
  notifyWarning,
})(App);
