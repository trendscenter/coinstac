import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose, graphql, withApollo } from 'react-apollo';
import PropTypes from 'prop-types';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import {
  FETCH_ALL_CONSORTIA_QUERY,
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

  setConsortium = (consortium) => {
    this.setState({ consortium });
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

  getMapItem = (consortium) => {
    const { user } = this.props.auth;
    const { pipelines } = this.props;
    let pipeline = pipelines.find( pipeline => pipeline.id === consortium.activePipelineId );
    if (pipeline && isUserA(user.id, consortium.owners) || pipeline && isUserA(user.id, consortium.members)) {
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
    } = this.props;

    const {
      consortium,
    } = this.state;

    return (
      <div>
      {consortium ?
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
            {consortia && consortia.map(consortium => this.getMapItem(consortium))}
          </Grid>
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
