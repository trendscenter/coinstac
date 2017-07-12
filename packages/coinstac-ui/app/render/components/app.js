import Notify from './notification';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

class App extends Component { // eslint-disable-line react/prefer-stateless-function
  render() {
    const { children, loading: { isLoading, wip } } = this.props;

    return (
      <div className="app">
        <ul id="spinner" className={isLoading ? 'is-loading' : ''}>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
        </ul>

        {children}

        <ul id="loading_list">
          {Object.keys(wip).map((loadingKey, ndx) => {
            return (<li key={ndx}>{loadingKey}</li>);
          })}
        </ul>

        <Notify />
      </div>
    );
  }
}

App.displayName = 'App';

App.propTypes = {
  children: PropTypes.node,
  loading: PropTypes.object,
};

function mapStateToProps({ loading }) {
  return {
    loading,
  };
}

export default connect(mapStateToProps)(App);
