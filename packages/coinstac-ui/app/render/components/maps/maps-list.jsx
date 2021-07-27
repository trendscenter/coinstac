import React, { Component } from 'react';
import { connect } from 'react-redux';
import { graphql, withApollo } from '@apollo/react-hoc';
import { flowRight as compose } from 'lodash';
import PropTypes from 'prop-types';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import MapsListItem from './maps-list-item';
import { deleteDataMapping } from '../../state/ducks/maps';
import {
  UPDATE_CONSORTIUM_MAPPED_USERS_MUTATION,
} from '../../state/graphql/functions';
import { isUserInGroup, pipelineNeedsDataMapping } from '../../utils/helpers';

class MapsList extends Component {
  deleteDataMapping = consortiumId => () => {
    const { deleteDataMapping, consortia, updateConsortiumMappedUsers } = this.props;

    const consortium = consortia.find(c => c.id === consortiumId);

    deleteDataMapping(consortium.id, consortium.activePipelineId);

    updateConsortiumMappedUsers(consortium.id, false);
  }

  getMapItem = (consortium) => {
    const {
      auth,
      pipelines,
      maps,
    } = this.props;

    const pipeline = pipelines.find(pipeline => pipeline.id === consortium.activePipelineId);

    if (!pipeline || !isUserInGroup(auth.user.id, consortium.members)) {
      return null;
    }

    const hasDataMapping = maps.findIndex(m => m.consortiumId === consortium.id
      && m.pipelineId === consortium.activePipelineId) > -1;

    const dataMapIsComplete = maps.findIndex(m => m.consortiumId === consortium.id
      && m.pipelineId === consortium.activePipelineId && m.isComplete) > -1;

    const needsDataMapping = !hasDataMapping && pipelineNeedsDataMapping(pipeline);

    return (
      <Grid item xs={12} sm={12} md={6} lg={4} key={`${consortium.id}-list-item`}>
        <MapsListItem
          consortium={consortium}
          pipeline={pipeline}
          canDelete={hasDataMapping}
          onDelete={this.deleteDataMapping}
          dataMapIsComplete={dataMapIsComplete}
          needsDataMapping={needsDataMapping}
        />
      </Grid>
    );
  }

  render() {
    const { consortia } = this.props;

    return (
      <div>
        <div className="page-header">
          <Typography variant="h4">
            Maps
          </Typography>
        </div>
        <Grid
          container
          spacing={3}
          direction="row"
          alignItems="stretch"
        >
          {consortia && consortia.map(cons => this.getMapItem(cons))}
        </Grid>
      </div>
    );
  }
}

MapsList.propTypes = {
  auth: PropTypes.object.isRequired,
  consortia: PropTypes.array.isRequired,
  maps: PropTypes.array.isRequired,
  pipelines: PropTypes.array.isRequired,
  deleteDataMapping: PropTypes.func.isRequired,
  updateConsortiumMappedUsers: PropTypes.func.isRequired,
};

const mapStateToProps = ({ auth, maps }) => ({
  auth,
  maps: maps.consortiumDataMappings,
});

const ComponentWithData = compose(
  graphql(
    UPDATE_CONSORTIUM_MAPPED_USERS_MUTATION, {
      props: ({ mutate }) => ({
        updateConsortiumMappedUsers: (consortiumId, isMapped) => mutate({
          variables: { consortiumId, isMapped },
        }),
      }),
    }
  ),
  withApollo
)(MapsList);

export default connect(mapStateToProps, {
  deleteDataMapping,
})(ComponentWithData);
