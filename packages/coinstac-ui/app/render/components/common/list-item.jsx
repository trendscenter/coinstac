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
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
    marginTop: theme.spacing(2),
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  titleContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(1),
  },
  description: {
    marginBottom: theme.spacing(2),
  },
  highlight: {
    backgroundColor: 'yellow',
    color: 'red',
  },
  button: {
    marginTop: theme.spacing(1),
    marginRight: theme.spacing(1),
  },
  deleteButton: {
    marginTop: theme.spacing(1),
  },
  listItemActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  listItemActionsPrimary: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
});

function ListItem ({
  owner,
  highlight,
  itemOptions,
  itemObject,
  itemRoute,
  canDelete,
  deleteItem,
  linkButtonText,
  linkButtonColor,
  deleteButtonText,
  classes,
}) {
  if (!itemObject || !itemOptions) {
    return null;
  }

  return (
    <Paper
      key={`${itemObject.id}-list-item`}
      className={classes.rootPaper}
      elevation={4}
    >
      <div className={classes.titleContainer}>
        <Typography variant="h5" className={highlight ? classes.highlight : ''}>
          { itemObject.name }
        </Typography>
        {
          itemOptions.owner && <Typography>Owner</Typography>
        }
      </div>
      <Typography variant="body2" className={classes.description}>
        { itemObject.description }
      </Typography>
      { itemOptions.text }
      <div className={classes.listItemActions}>
        <div className={classes.listItemActionsPrimary}>
          <Button
            variant="contained"
            color={linkButtonColor || 'primary'}
            component={Link}
            to={`${itemRoute}/${itemObject.id}`}
            name={itemObject.name}
            className={classes.button}
          >
            { linkButtonText || 'View Details' }
          </Button>
          { itemOptions.actions }
        </div>
        {
          deleteItem && (owner || canDelete) && (
            <Button
              variant="contained"
              color="secondary"
              onClick={deleteItem(itemObject.id)}
              name={`${itemObject.name}-delete`}
              className={classes.deleteButton}
            >
              { deleteButtonText || 'Delete' }
              <DeleteIcon />
            </Button>
          )
        }
        { itemOptions.status }
      </div>
    </Paper>
  );
}

ListItem.defaultProps = {
  owner: false,
  highlight: false,
  linkButtonText: null,
  linkButtonColor: null,
  deleteButtonText: null,
  deleteItem: null,
  canDelete: false,
  itemOptions: null,
};

ListItem.propTypes = {
  canDelete: PropTypes.bool,
  classes: PropTypes.object.isRequired,
  deleteButtonText: PropTypes.string,
  highlight: PropTypes.bool,
  itemObject: PropTypes.object.isRequired,
  itemOptions: PropTypes.object,
  itemRoute: PropTypes.string.isRequired,
  linkButtonColor: PropTypes.string,
  linkButtonText: PropTypes.string,
  owner: PropTypes.bool,
  deleteItem: PropTypes.func,
};

export default withStyles(styles)(ListItem);
