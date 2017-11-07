import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Notify from './notification';
import { autoLogin } from '../state/ducks/auth';

class App extends Component { // eslint-disable-line react/prefer-stateless-function
  constructor(props) {
    super(props);

    this.state = { checkJWT: false };
  }

  componentWillMount() {
    console.log('autologin');
    this.props.autoLogin()
    .then(() => {
      this.setState({ checkJWT: true });
    });
  }

  render() {
    const { children, loading: { isLoading, wip } } = this.props;

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

        <Notify />
      </div>
    );
  }
}

App.displayName = 'App';

App.propTypes = {
  autoLogin: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  loading: PropTypes.object.isRequired,
};

function mapStateToProps({ loading }) {
  return {
    loading,
  };
}

export default connect(mapStateToProps, { autoLogin })(App);
