import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose, graphql, withApollo } from 'react-apollo';
import { Alert, Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { ipcRenderer } from 'electron';
import PropTypes from 'prop-types';
import {
  FETCH_ALL_CONSORTIA_QUERY,
  FETCH_ALL_PIPELINES_QUERY,
} from '../../state/graphql/functions';
import MapsItem from './maps-item';

const isUserA = (userId, groupArr) => {
  return groupArr.indexOf(userId) !== -1;
};

class MapsList extends Component {
  constructor(props) {
    super(props);
    this.getMapItem = this.getMapItem.bind(this);
    this.openModal = this.openModal.bind(this);
    this.getMapped = this.getMapped.bind(this);
  }

  getMapped(member, owner, consortium) {
    const { auth: { user } } = this.props;
    const actions = [];
    const text = [];
    let isMapped = false;

    if (this.props.associatedConsortia.length > 0) {
      const assocCons = this.props.associatedConsortia.find(c => c.id === consortium.id);
      if (assocCons && assocCons.isMapped) {
        isMapped = assocCons.isMapped;
        return isMapped;
      }
    }
  }

  getMapItem(consortium) {
    const { user } = this.props.auth;
    if (isUserA(user.id, consortium.owners) || isUserA(user.id, consortium.members)) {
      return (
        <MapsItem
          key={`${consortium.id}-list-item`}
          deleteItem={this.openModal}
          itemObject={consortium}
          itemOptions
          itemRoute={'/dashboard/maps'}
          itemMapped={
            this.getMapped(
              isUserA(user.id, consortium.members),
              isUserA(user.id, consortium.owners),
              consortium
            )
          }
          pipelineId={consortium.activePipelineId}
        />
      );
    }
  }

  openModal(consortiumId) {
    return () => {
      this.setState({
        showModal: true,
        consortiumToDelete: consortiumId,
      });
    };
  }

  render() {
    const {
      consortia,
      pipelines,
    } = this.props;

    return (
      <div>
        <div className="page-header clearfix">
          <h1 className="nav-item-page-title">Maps</h1>
        </div>
        <div className="row">
          {consortia && consortia.map(consortium => this.getMapItem(consortium))}
        </div>
      </div>
    );
  }
}

MapsList.propTypes = {
  consortia: PropTypes.array.isRequired,
  associatedConsortia: PropTypes.array.isRequired,
};

const mapStateToProps = ({ auth, collections: { associatedConsortia } }) => {
  return { auth, associatedConsortia };
};

const MapsListWithData = compose(
  graphql(FETCH_ALL_CONSORTIA_QUERY,'fetchAllConsortia'),
  withApollo
)(MapsList);

export default connect(mapStateToProps,
  {}
)(MapsListWithData);
