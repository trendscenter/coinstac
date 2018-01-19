import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Notifications from 'react-notification-system-redux';
// import Notify from './notification';
import { autoLogin } from '../state/ducks/auth';

class App extends Component { // eslint-disable-line react/prefer-stateless-function
  constructor(props) {
    super(props);

    this.state = { checkJWT: false };
  }

  componentWillMount() {
    this.props.autoLogin()
    .then(() => {
      this.setState({ checkJWT: true });
    });
  }

  render() {
    const { children, loading: { isLoading, wip }, notifications } = this.props;

    return (
      <div className="app">
        <ul id="spinner" className={isLoading ? 'is-loading' : ''}>
          <li />
          <li />
          <li />
          <li />
        </ul>

        {this.state.checkJWT && children}

        <ul id="loading_list">
          {Object.keys(wip).map(loadingKey =>
            (<li key={loadingKey}>{loadingKey}</li>)
          )}
        </ul>

        <Notifications
          notifications={notifications}
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

export default connect(mapStateToProps, { autoLogin })(App);
