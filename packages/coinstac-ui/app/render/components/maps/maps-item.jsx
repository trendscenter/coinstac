import React from 'react';
import PropTypes from 'prop-types';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  rootPaper: {
    ...theme.mixins.gutters(),
    paddingTop: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 2,
    marginTop: theme.spacing.unit * 2,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  description: {
    marginBottom: theme.spacing.unit,
  },
  activePipelineContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  activePipelineLabel: {
    marginRight: theme.spacing.unit,
  },
  actionsContainer: {
    display: 'flex',
    alignItems: 'center',
  },
});

function MapsItem(props) {
  const {
    itemOptions,
    itemObject,
    itemMapped,
    pipelineId,
    setConsortium,
    classes,
  } = props;

  return (
    <Grid item sm={4}>
      <Paper
        className={classes.rootPaper}
        elevation={1}
      >
        <div>
          <Typography variant="headline">
            { itemObject.name }
          </Typography>
          {
            itemObject.description
            && (
              <Typography variant="body1" className={classes.description}>
                { itemObject.description }
              </Typography>
            )
          }
          {itemOptions.text}
          <div className={classes.activePipelineContainer}>
            <Typography variant="subtitle1" className={classes.activePipelineLabel}>
              Active Pipeline:
            </Typography>
            <Typography variant="body1">
              {pipelineId}
            </Typography>
          </div>
        </div>
        <div className={classes.actionsContainer}>
          {
            itemMapped
              ? <Button variant="contained" color="primary" onClick={() => setConsortium(itemObject)}>View Details</Button>
              : <Button variant="contained" color="secondary" onClick={() => setConsortium(itemObject)}>Map Data to Consortia</Button>
          }
          {itemOptions.actions}
          {
            itemMapped
              ? <span className="mapped true" />
              : <span className="mapped false" />
          }
        </div>
      </Paper>
    </Grid>
  );
}

MapsItem.defaultProps = {
  owner: false,
};

MapsItem.propTypes = {
  itemObject: PropTypes.object.isRequired,
  pipelineId: PropTypes.string.isRequired,
  owner: PropTypes.bool,
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(MapsItem);
