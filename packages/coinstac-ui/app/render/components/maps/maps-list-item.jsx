import React from 'react';
import { Link } from 'react-router';
import PropTypes from 'prop-types';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import { green, yellow } from '@material-ui/core/colors';
import Button from '@material-ui/core/Button';
import DeleteIcon from '@material-ui/icons/Delete';
import WarningIcon from '@material-ui/icons/Warning';
import CheckIcon from '@material-ui/icons/Check';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  rootPaper: {
    padding: theme.spacing(2),
    marginTop: theme.spacing(2),
    height: '100%',
    [theme.breakpoints.up('sm')]: {
      paddingLeft: theme.spacing(3),
      paddingRight: theme.spacing(3),
    },
  },
  title: {
    marginBottom: theme.spacing(1),
  },
  contentContainer: {
    marginTop: theme.spacing(2),
  },
  labelInline: {
    display: 'inline-block',
    fontWeight: 'bold',
    marginRight: theme.spacing(1),
  },
  value: {
    display: 'inline-block',
  },
  row: {
    marginTop: theme.spacing(1),
  },
});

const MapsListItem = ({
  consortium,
  pipeline,
  hasDataMapping,
  onDelete,
  needsDataMapping,
  dataMapIsComplete,
  classes,
}) => (
  <Paper
    key={`${consortium.id}-list-item`}
    className={classes.rootPaper}
    elevation={10}
  >
    <Typography variant="h4" className={classes.title}>
      { consortium.name }
    </Typography>
    <div className={classes.contentContainer}>
      <Typography className={classes.labelInline}>
        Active Pipeline:
      </Typography>
      <Typography className={classes.value}>{ pipeline.name }</Typography>
    </div>

    {needsDataMapping && (
      <div className={classes.row}>
        <Button
          variant="contained"
          color={hasDataMapping ? 'secondary' : 'primary'}
          component={Link}
          to={`/dashboard/maps/${consortium.id}`}
          name={consortium.name}
        >
          { hasDataMapping ? 'Edit Mapped Data' : 'Map Data to Consortium' }
        </Button>
      </div>
    )}

    {needsDataMapping && hasDataMapping && (
      <div className={classes.row}>
        <Button
          variant="contained"
          color="secondary"
          onClick={onDelete(consortium.id)}
          name={`${consortium.name}-delete`}
        >
          Clear Mapping
          <DeleteIcon />
        </Button>
      </div>
    )}

    <div className={classes.row}>
      {(!needsDataMapping || dataMapIsComplete)
        ? <CheckIcon style={{ color: green[500] }} fontSize="large" />
        : <WarningIcon style={{ color: yellow[700] }} fontSize="large" />}
    </div>
  </Paper>
);

MapsListItem.propTypes = {
  classes: PropTypes.object.isRequired,
  consortium: PropTypes.object.isRequired,
  pipeline: PropTypes.object.isRequired,
  onDelete: PropTypes.func.isRequired,
  hasDataMapping: PropTypes.bool.isRequired,
  needsDataMapping: PropTypes.bool.isRequired,
  dataMapIsComplete: PropTypes.bool.isRequired,
};

export default withStyles(styles)(MapsListItem);
