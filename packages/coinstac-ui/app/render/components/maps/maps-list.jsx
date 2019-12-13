import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose, graphql, withApollo } from 'react-apollo';
import PropTypes from 'prop-types';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import MapsItem from './maps-item';
import MapsEdit from './maps-edit';
import {
  getAllCollections,
  deleteCollection,
  unmapAssociatedConsortia
} from '../../state/ducks/collections';

class MapsList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      consortium: this.props.consortium
    }

    this.setConsortium = this.setConsortium.bind(this);
    this.saveCollection = this.saveCollection.bind(this);
  }

  setConsortium(consortium) {
    this.setState({ consortium });
  }

  saveCollection(e) {
    const { collection } = this.state;
    if (e) {
      e.preventDefault();
    }
    this.props.saveCollection(collection);
  }

  getMapped(consortium) {
    let isMapped = false;
    if (this.props.associatedConsortia.length > 0) {
      const assocCons = this.props.associatedConsortia.find(c => c.id === consortium.id);
      if (assocCons && assocCons.isMapped) {
        isMapped = assocCons.isMapped;
        return isMapped;
      }
    }
  }

  isMember(userId, groupArr) {
    if(userId && groupArr){
      return groupArr.indexOf(userId) !== -1;
    }
  };

  unsetMap = (consortium) => {
    const { collections, pipelines, unmapAssociatedConsortia, deleteCollection } = this.props;
    const assocCons = this.props.associatedConsortia.find(c => c.id === consortium.id);
    const pipeline = pipelines.find(p => p.id === consortium.activePipelineId );
    const collection = this.props.collections.find(c => c.associatedConsortia[0] === consortium.id);
    const groups = collection.fileGroups;
    let groupId = Object.keys(groups);
    groupId = groupId[0];
    delete groups[groupId];
    unmapAssociatedConsortia(collection.associatedConsortia, consortium.id)
    .then(() => {
      deleteCollection(collection.id);
    });
  }

  getMapItem = (consortium) => {
    const { user } = this.props.auth;
    const { pipelines } = this.props;
    let pipeline = pipelines.find( pipeline => pipeline.id === consortium.activePipelineId );
    if (pipeline && this.isMember(user.id, consortium.owners) ||
      pipeline && this.isMember(user.id, consortium.members)) {
      return (
        <MapsItem
          key={`${consortium.id}-list-item`}
          deleteItem={this.openModal}
          itemObject={consortium}
          itemOptions
          itemMapped={
            this.getMapped(consortium)
          }
          pipelineId={pipeline.name}
          setConsortium={this.setConsortium}
          resetMapping={this.unsetMap}
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
      auth: { user },
      consortia,
      pipelines,
      mapId,
    } = this.props;

    const {
      consortium,
    } = this.state;

    return (
      <div>
      {consortium && mapId ?
        <MapsEdit
          consortia={consortia}
          consortium={consortium}
          mapped={
            this.getMapped(consortium)
          }
          pipelines={this.props.pipelines}
          runs={this.props.runs}
        />:
        <div>
          <div className="page-header">
            <Typography variant="h4">
              Maps
            </Typography>
          </div>
          <Grid
            container
            spacing={16}
            direction="row"
            alignItems="stretch"
          >
            {consortia && consortia.map(cons => this.getMapItem(cons))}
          </Grid>
        </div>
      }
      </div>
    );
  }
}

MapsList.propTypes = {
  associatedConsortia: PropTypes.array.isRequired,
  consortia: PropTypes.array.isRequired,
  collections: PropTypes.array.isRequired,
  deleteCollection: PropTypes.func.isRequired,
  unmapAssociatedConsortia: PropTypes.func.isRequired,
};

function mapStateToProps({ auth,
  collections: { associatedConsortia, collections } }) {
  return { auth, associatedConsortia, collections };
}

export default connect(mapStateToProps, {
    getAllCollections,
    deleteCollection,
    unmapAssociatedConsortia,
})(MapsList);
