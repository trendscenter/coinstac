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
import makeStyles from '@material-ui/core/styles/makeStyles';

const useStyles = makeStyles(theme => ({
  rootPaper: {
    padding: theme.spacing(2),
    marginTop: theme.spacing(2),
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    [theme.breakpoints.up('sm')]: {
      paddingLeft: theme.spacing(3),
      paddingRight: theme.spacing(3),
    },
  },
  contentContainer: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  labelInline: {
    fontWeight: 'bold',
    marginRight: theme.spacing(1),
    display: 'inline-block',
  },
  value: {
    display: 'inline-block',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: 8,
  },
  primaryAction: {
    display: 'flex',
    alignItems: 'center',
    columnGap: 8,
  },
  button: {
    width: 'fit-content',
  },
}));

const MapsListItem = ({
  consortium,
  pipeline,
  canDelete,
  onDelete,
  needsDataMapping,
  dataMapIsComplete,
}) => {
  const classes = useStyles();

  return (
    <Paper
      key={`${consortium.id}-list-item`}
      className={classes.rootPaper}
      elevation={10}
    >
      <Typography variant="h4">
        {consortium.name}
      </Typography>
      <div className={classes.contentContainer}>
        {pipeline ? (
          <>
            <Typography className={classes.labelInline}>
              Active Pipeline:
            </Typography>
            <Typography className={classes.value}>
              {pipeline.name}
            </Typography>
          </>
        ) : (
          <Typography className={classes.labelInline}>
            No active pipeline
          </Typography>
        )}
      </div>
      {pipeline && (
        <div className={classes.actions}>
          <div className={classes.primaryAction}>
            <Button
              className={classes.button}
              variant="contained"
              color={needsDataMapping ? 'secondary' : 'primary'}
              component={Link}
              to={`/dashboard/maps/${consortium.id}`}
              name={consortium.name}
            >
              {needsDataMapping ? 'Map Data to Consortium' : 'Edit Mapped Data'}
            </Button>
            {(!needsDataMapping || dataMapIsComplete)
              ? <CheckIcon style={{ color: green[500] }} fontSize="large" />
              : <WarningIcon style={{ color: yellow[700] }} fontSize="large" />
            }
          </div>
          {canDelete && (
            <Button
              className={classes.button}
              variant="contained"
              color="secondary"
              onClick={onDelete(consortium.id)}
              name={`${consortium.name}-delete`}
            >
              Clear Mapping
              <DeleteIcon />
            </Button>
          )}
        </div>
      )}
    </Paper>
  );
};

MapsListItem.propTypes = {
  consortium: PropTypes.object.isRequired,
  pipeline: PropTypes.object,
  onDelete: PropTypes.func,
  canDelete: PropTypes.bool.isRequired,
  needsDataMapping: PropTypes.bool.isRequired,
  dataMapIsComplete: PropTypes.bool.isRequired,
};

MapsListItem.defaultProps = {
  pipeline: null,
  onDelete: () => { },
};

export default MapsListItem;
