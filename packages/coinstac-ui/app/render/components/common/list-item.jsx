import React from 'react';
import { Link } from 'react-router';
import PropTypes from 'prop-types';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import DeleteIcon from '@material-ui/icons/Delete';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  rootPaper: {
    ...theme.mixins.gutters(),
    paddingTop: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 2,
    marginTop: theme.spacing.unit * 2,
  },
  title: {
    marginBottom: theme.spacing.unit,
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
    className={classes.rootPaper}
    elevation={1}
  >
    <Typography variant="headline" className={classes.title}>
      { itemObject.name }
    </Typography>
    <Typography variant="body1">
      { itemObject.description }
    </Typography>
    { itemOptions.text }
    <div className="list-item__actions">
      <div>
        <Button
          variant="contained"
          color="primary"
          component={Link}
          to={`${itemRoute}/${itemObject.id}`}
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
