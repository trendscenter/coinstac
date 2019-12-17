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
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  titleContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.unit,
  },
  description: {
    marginBottom: theme.spacing.unit * 2,
  },
});

const ListItem = ({
  owner,
  itemOptions,
  itemObject,
  itemRoute,
  deleteItem,
  linkButtonText,
  linkButtonColor,
  classes,
}) => (
  <Paper
    className={classes.rootPaper}
    elevation={4}
  >
    <div className={classes.titleContainer}>
      <Typography variant="headline">
        { itemObject.name }
      </Typography>
      {
        itemOptions.owner && <Typography>Owner</Typography>
      }
    </div>
    <Typography variant="body1" className={classes.description}>
      { itemObject.description }
    </Typography>
    { itemOptions.text }
    <div className="list-item__actions">
      <div className="list-item__actions-primary">
        <Button
          variant="contained"
          color={linkButtonColor || 'primary'}
          component={Link}
          to={`${itemRoute}/${itemObject.id}`}
          name={itemObject.name}
        >
          { linkButtonText || 'View Details' }
        </Button>
        { itemOptions.actions }
      </div>
      {
        deleteItem && owner && (
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
  linkButtonText: null,
  linkButtonColor: null,
  deleteItem: null,
};

ListItem.propTypes = {
  itemObject: PropTypes.object.isRequired,
  itemOptions: PropTypes.object.isRequired,
  itemRoute: PropTypes.string.isRequired,
  owner: PropTypes.bool,
  deleteItem: PropTypes.func,
  linkButtonText: PropTypes.string,
  linkButtonColor: PropTypes.string,
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(ListItem);
