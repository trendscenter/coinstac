import React, { Component } from 'react';
import { connect } from 'react-redux';
import { ipcRenderer } from 'electron';
import PropTypes from 'prop-types';
import { Tab, Tabs } from 'react-bootstrap';
import { compose, graphql, withApollo } from 'react-apollo';
import MapsEdit from './maps-edit';
import MapsList from './maps-list';
import {
  consortiaMembershipProp,
  getAllAndSubProp,
  getSelectAndSubProp,
  saveDocumentProp,
  userRolesProp,
} from '../../state/graphql/props';
import { notifyInfo, notifySuccess } from '../../state/ducks/notifyAndLog';
import {
  ADD_USER_ROLE_MUTATION,
  CONSORTIUM_CHANGED_SUBSCRIPTION,
  FETCH_ALL_USERS_QUERY,
  FETCH_ALL_CONSORTIA_QUERY,
  FETCH_CONSORTIUM_QUERY,
  JOIN_CONSORTIUM_MUTATION,
  LEAVE_CONSORTIUM_MUTATION,
  REMOVE_USER_ROLE_MUTATION,
  SAVE_CONSORTIUM_MUTATION,
  USER_CHANGED_SUBSCRIPTION,
} from '../../state/graphql/functions';

const styles = {
  tab: {
    marginTop: 10,
  },
};

class Maps extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <div className="page-header clearfix">
          <h1 className="pull-left">Maps</h1>
        </div>
        <MapsList />
      </div>
    );
  }
}

Maps.defaultProps = {
  consortia: null,
};

Maps.propTypes = {
  associatedConsortia: PropTypes.array.isRequired,
  consortia: PropTypes.array.isRequired,
  notifyInfo: PropTypes.func.isRequired,
  notifySuccess: PropTypes.func.isRequired,
};

const mapStateToProps = ({ auth, collections: { associatedConsortia } }) => {
  return { auth, associatedConsortia };
};

export default connect(mapStateToProps,
  {
    notifyInfo,
    notifySuccess,
  }
)(MapsList);
