import React, { Component } from 'react';
import { connect } from 'react-redux';
import { ipcRenderer } from 'electron';
import PropTypes from 'prop-types';
import { Tab, Tabs } from 'react-bootstrap';
import { graphql, compose } from 'react-apollo';
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

class MapsTabs extends Component {
  constructor(props) {
    super(props);

    const consortium = {
      name: '',
      description: '',
      members: [],
      owners: [],
      activePipelineId: '',
      activeComputationInputs: [],
      tags: [],
    };

    this.state = {
      consortium,
      unsubscribeConsortia: null,
      unsubscribeUsers: null,
      key: 1
    };
  }

  render() {
    return (
      <div>
        <div className="page-header clearfix">
          <h1 className="pull-left">Maps</h1>
        </div>
        <Tabs defaultActiveKey={1} id="map-tabs">
            <Tab
              eventKey={1}
              title="Consortia"
              style={styles.tab}
            >
              <MapsList />
            </Tab>
            {typeof this.state.consortium.id !== 'undefined' ?
              <Tab
                eventKey={2}
                title="Pipelines"
                style={styles.tab}
              >
                <MapEdit
                  consortium={this.state.consortium}
                  owner={isOwner}
                  pipelines={this.props.pipelines}
                />
              </Tab>
            : ''}
        </Tabs>
      </div>
    );
  }
}

MapsTabs.defaultProps = {
  consortia: null,
};

MapsTabs.propTypes = {
  consortia: PropTypes.array.isRequired,
  notifyInfo: PropTypes.func.isRequired,
  notifySuccess: PropTypes.func.isRequired,
};

function mapStateToProps({ auth }) {
  return { auth };
}

const MapsTabsWithData = compose(

)(MapsTabs);


export default connect(mapStateToProps,
  {
    notifyInfo,
    notifySuccess,
  }
)(MapsTabsWithData);
