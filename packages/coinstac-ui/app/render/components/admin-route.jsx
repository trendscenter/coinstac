import React from 'react';
import PropTypes from 'prop-types';
import { Route, Redirect } from 'react-router';
import { connect } from 'react-redux';
import { isAdmin } from '../utils/helpers';

const AdminRoute = ({ component: Component, user, ...rest }) => {
  return (
    <Route
      {...rest}
      render={
        props => isAdmin(user) ?
          <Component {...props} /> :
          <Redirect to="/dashboard" />
      }
    />
  );
}

AdminRoute.propTypes = {
  component: PropTypes.node,
};

const mapStateToProps = ({ auth }) => ({
  user: auth.user,
});

export default connect(mapStateToProps)(AdminRoute);
