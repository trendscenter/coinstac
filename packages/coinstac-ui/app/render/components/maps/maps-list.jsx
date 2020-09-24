import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import { withStyles } from '@material-ui/core';
import ListItem from '../common/list-item';
import { deleteDataMapping } from '../../state/ducks/maps';
import { pipelineNeedsDataMapping } from '../../../main/utils/run-pipeline-functions';
import { isUserInGroup } from '../../utils/helpers';

const styles = theme => ({
  contentContainer: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  labelInline: {
    fontWeight: 'bold',
    marginRight: theme.spacing(1),
    display: 'inline-block',
  },
  value: {
    display: 'inline-block',
  },
});

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
      classes,
    } = this.props;

    const pipeline = pipelines.find(pipeline => pipeline.id === consortium.activePipelineId);

    if (!pipeline || !isUserInGroup(auth.user.id, consortium.members)) {
      return null;
    }

    const hasDataMap = maps.findIndex(m => m.consortiumId === consortium.id
      && m.pipelineId === consortium.activePipelineId) > -1;

    const needsDataMapping = !hasDataMap && pipelineNeedsDataMapping(pipeline);

    const itemOptions = {
      text: [],
      status: [],
    };

    itemOptions.text.push((
      <div key={`${consortium.id}-active-pipeline-text`} className={classes.contentContainer}>
        <Typography className={classes.labelInline}>
          Active Pipeline:
        </Typography>
        <Typography className={classes.value}>{ pipeline.name }</Typography>
      </div>
    ));

    itemOptions.status.push((
      <span
        key={`${consortium.id}-map-status`}
        className={needsDataMapping ? 'mapped false' : 'mapped true'}
      />
    ));

    return (
      <Grid item xs={12} sm={12} md={6} lg={4} key={`${consortium.id}-list-item`}>
        <ListItem
          itemObject={consortium}
          itemOptions={itemOptions}
          itemRoute="/dashboard/maps"
          linkButtonText={needsDataMapping ? 'Map Data to Consortium' : 'View Details'}
          linkButtonColor={needsDataMapping ? 'secondary' : 'primary'}
          canDelete={hasDataMap}
          deleteItem={this.deleteDataMapping}
          deleteButtonText="Clear Mapping"
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
          spacing={2}
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
  classes: PropTypes.object.isRequired,
  consortia: PropTypes.array.isRequired,
  maps: PropTypes.array.isRequired,
  pipelines: PropTypes.array.isRequired,
  deleteDataMapping: PropTypes.func.isRequired,
};

const mapStateToProps = ({ auth, maps }) => ({
  auth,
  maps: maps.consortiumDataMappings,
});

export default withStyles(styles)(
  connect(mapStateToProps, {
    deleteDataMapping,
  })(MapsList)
);
