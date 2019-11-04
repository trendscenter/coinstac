import React, { Component } from 'react';
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
  }

  componentDidMount() {
    const {
      autoLogin,
      setError,
      logout,
      router,
      notifyWarning,
    } = this.props;

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

  render() {
    const { children, loading: { isLoading }, notifications } = this.props;

    return (
      <div className="app">
        <ActivityIndicator visible={isLoading} />

        {this.state.checkJWT && children}

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
  autoLogin: PropTypes.func.isRequired,
  logout: PropTypes.func.isRequired,
  setError: PropTypes.func.isRequired,
  notifyWarning: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  loading: PropTypes.object.isRequired,
  notifications: PropTypes.array,
  router: PropTypes.object.isRequired,
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
