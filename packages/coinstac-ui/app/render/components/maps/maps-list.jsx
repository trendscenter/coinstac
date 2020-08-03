import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import MapsListItem from './maps-list-item';
import { deleteDataMapping } from '../../state/ducks/maps';
import { pipelineNeedsDataMapping } from '../../../main/utils/run-pipeline-functions';

function isMember(userId, groupArr) {
  if (userId && groupArr) {
    return groupArr.indexOf(userId) !== -1;
  }
}

class MapsList extends Component {
  deleteDataMapping = consortiumId => () => {
    const { deleteDataMapping, consortia } = this.props;

    const consortium = consortia.find(c => c.id === consortiumId);

    deleteDataMapping(consortium.id, consortium.activePipelineId);
  }

  getMapItem = (consortium) => {
    const {
      auth,
      pipelines,
      maps,
    } = this.props;

    const pipeline = pipelines.find(pipeline => pipeline.id === consortium.activePipelineId);

    if (!pipeline || !isMember(auth.user.id, consortium.members)) {
      return null;
    }

    const hasDataMap = maps.findIndex(m => m.consortiumId === consortium.id
      && m.pipelineId === consortium.activePipelineId) > -1;

    const needsDataMapping = !hasDataMap && pipelineNeedsDataMapping(pipeline);

    return (
      <Grid item sm={6} lg={4} key={`${consortium.id}-list-item`}>
        <MapsListItem
          consortium={consortium}
          pipeline={pipeline}
          canDelete={hasDataMap}
          onDelete={this.deleteDataMapping}
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
};

const mapStateToProps = ({ auth, maps }) => ({
  auth,
  maps: maps.consortiumDataMappings,
});

export default connect(mapStateToProps, {
  deleteDataMapping,
})(MapsList);
