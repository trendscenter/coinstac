import React from 'react';
import PropTypes from 'prop-types';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import DeleteIcon from '@material-ui/icons/Delete';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  root: {
    ...theme.mixins.gutters(),
    paddingTop: theme.spacing.unit,
    paddingBottom: theme.spacing.unit,
    marginTop: theme.spacing.unit * 2,
  },
});

const ListItem = ({
  owner,
  itemOptions,
  itemObject,
  itemRoute,
  deleteItem,
  classes,
}) => (
  <Paper
    className={classes.root}
    elevation={1}
  >
    <Typography component="h3">
      { itemObject.name }
    </Typography>
    <p>
      { itemObject.description }
    </p>
    { itemOptions.text }
    <div className="list-item__actions">
      <div>
        <Button
          variant="contained"
          color="primary"
          href={`${itemRoute}/${itemObject.id}`}
          name={itemObject.name}
        >
          View Details
        </Button>
        { itemOptions.actions }
      </div>
      {
        owner
        && (
          <Button
            variant="contained"
            color="secondary"
            onClick={deleteItem(itemObject.id)}
            name={`${itemObject.name}-delete`}
          >
            Delete
            <DeleteIcon />
          </Button>
        )
      }
    </div>
  </Paper>
);

ListItem.defaultProps = {
  owner: false,
};

ListItem.propTypes = {
  itemObject: PropTypes.object.isRequired,
  itemOptions: PropTypes.object.isRequired,
  itemRoute: PropTypes.string.isRequired,
  owner: PropTypes.bool,
  deleteItem: PropTypes.func.isRequired,
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(ListItem);
