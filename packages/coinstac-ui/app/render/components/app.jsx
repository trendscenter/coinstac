import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { ipcRenderer } from 'electron';
import Notifications from 'react-notification-system-redux';
import ActivityIndicator from './activity-indicator/activity-indicator';
import { autoLogin, logout, setError } from '../state/ducks/auth';
import { EXPIRED_TOKEN } from '../utils/error-codes';

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
    this.props.autoLogin()
    .then(() => {
      this.setState({ checkJWT: true });
    });

    ipcRenderer.on(EXPIRED_TOKEN, () => {
      this.props.setError(EXPIRED_TOKEN);
      this.props.logout();
      this.props.router.push('/login');
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
})(App);
