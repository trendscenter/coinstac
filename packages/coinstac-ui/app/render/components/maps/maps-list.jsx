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
import MapsEdit from './maps-edit';

const isUserA = (userId, groupArr) => {
  return groupArr.indexOf(userId) !== -1;
};

class MapsList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      consortium: null
    }

    this.setConsortium = this.setConsortium.bind(this);
  }

  componentDidMount = () => {
    console.log(this.props);
  }

  setConsortium = (consortium) => {
    this.setState({ consortium });
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

  getMapItem = (consortium) => {
    const { user } = this.props.auth;
    if (isUserA(user.id, consortium.owners) || isUserA(user.id, consortium.members)) {
      return (
        <MapsItem
          key={`${consortium.id}-list-item`}
          deleteItem={this.openModal}
          itemObject={consortium}
          itemOptions
          itemMapped={
            this.getMapped(
              isUserA(user.id, consortium.members),
              isUserA(user.id, consortium.owners),
              consortium
            )
          }
          pipelineId={consortium.activePipelineId}
          setConsortium={this.setConsortium}
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
      {this.state.consortium ?
        <MapsEdit
          consortium={this.state.consortium}
          pipelines={this.props.pipeline}
          runs={this.props.runs}
        />:
        <div>
          <div className="page-header clearfix">
            <h1 className="nav-item-page-title">Maps</h1>
          </div>
          <div className="row">
            {consortia && consortia.map(consortium => this.getMapItem(consortium))}
          </div>
        </div>
      }
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
