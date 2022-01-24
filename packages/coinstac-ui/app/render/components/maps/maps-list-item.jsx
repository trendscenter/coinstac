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
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    [theme.breakpoints.up('sm')]: {
      paddingLeft: theme.spacing(3),
      paddingRight: theme.spacing(3),
    },
  },
  title: {
    marginBottom: theme.spacing(1),
  },
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

const MapsListItem = ({
  consortium,
  pipeline,
  canDelete,
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
    <div className="list-item__actions">
      <div className="list-item__actions-primary">
        <Button
          variant="contained"
          color={needsDataMapping ? 'secondary' : 'primary'}
          component={Link}
          to={`/dashboard/maps/${consortium.id}`}
          name={consortium.name}
        >
          { needsDataMapping ? 'Map Data to Consortium' : 'Edit Mapped Data' }
        </Button>
      </div>
      {
        canDelete && (
          <Button
            variant="contained"
            color="secondary"
            onClick={onDelete(consortium.id)}
            name={`${consortium.name}-delete`}
          >
            Clear Mapping
            <DeleteIcon />
          </Button>
        )
      }
      {
        (!needsDataMapping || dataMapIsComplete)
          ? <CheckIcon style={{ color: green[500] }} fontSize="large" />
          : <WarningIcon style={{ color: yellow[700] }} fontSize="large" />
      }
    </div>
  </Paper>
);

MapsListItem.propTypes = {
  classes: PropTypes.object.isRequired,
  consortium: PropTypes.object.isRequired,
  pipeline: PropTypes.object.isRequired,
  onDelete: PropTypes.func.isRequired,
  canDelete: PropTypes.bool.isRequired,
  needsDataMapping: PropTypes.bool.isRequired,
  dataMapIsComplete: PropTypes.bool.isRequired,
};

export default withStyles(styles)(MapsListItem);
