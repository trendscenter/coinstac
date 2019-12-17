import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import { withStyles } from '@material-ui/core';
import ListItem from '../common/list-item';

const styles = theme => ({
  contentContainer: {
    marginTop: theme.spacing.unit,
    marginBottom: theme.spacing.unit,
  },
  labelInline: {
    fontWeight: 'bold',
    marginRight: theme.spacing.unit,
    display: 'inline-block',
  },
  value: {
    display: 'inline-block',
  },
});

function isMember(userId, groupArr) {
  if (userId && groupArr) {
    return groupArr.indexOf(userId) !== -1;
  }
}

class MapsList extends Component {
  getMapItem = (consortium) => {
    const { auth, pipelines, classes } = this.props;

    const pipeline = pipelines.find(pipeline => pipeline.id === consortium.activePipelineId);

    if (!pipeline || !isMember(auth.user.id, consortium.members)) {
      return null;
    }

    const isDataMapped = this.isDataMappedToConsortium(consortium);

    const itemOptions = {
      text: [],
      actions: [],
    };

    itemOptions.text.push((
      <div key={`${consortium.id}-active-pipeline-text`} className={classes.contentContainer}>
        <Typography className={classes.labelInline}>
          Active Pipeline:
        </Typography>
        <Typography className={classes.value}>{ pipeline.name }</Typography>
      </div>
    ));

    itemOptions.actions.push((
      <span
        key={`${consortium.id}-map-status`}
        className={isDataMapped ? 'mapped true' : 'mapped false'}
      />
    ));

    return (
      <Grid item sm={4} lg={3} key={`${consortium.id}-list-item`}>
        <ListItem
          itemObject={consortium}
          itemOptions={itemOptions}
          itemRoute="/dashboard/maps"
          linkButtonText={isDataMapped ? 'View Details' : 'Map Data to Consortium'}
          linkButtonColor={isDataMapped ? 'primary' : 'secondary'}
        />
      </Grid>
    );
  }

  isDataMappedToConsortium(consortium) {
    const { associatedConsortia } = this.props;

    if (!associatedConsortia) {
      return false;
    }

    const assocCons = associatedConsortia.find(c => c.id === consortium.id);
    return assocCons && assocCons.isMapped;
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
          spacing={16}
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
  associatedConsortia: PropTypes.array.isRequired,
  auth: PropTypes.object.isRequired,
  consortia: PropTypes.array.isRequired,
  pipelines: PropTypes.array.isRequired,
  classes: PropTypes.object.isRequired,
};

const mapStateToProps = ({ auth, collections: { associatedConsortia } }) => {
  return { auth, associatedConsortia };
};

export default withStyles(styles)(
  connect(mapStateToProps)(MapsList)
);
