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
  highlight: {
    backgroundColor: 'yellow',
    color: 'red',
  },
});

const ListItem = ({
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
}) => (
  <Paper
    key={`${itemObject.id}-list-item`}
    className={classes.rootPaper}
    elevation={4}
  >
    <div className={classes.titleContainer}>
      <Typography variant="headline" className={highlight ? classes.highlight : ''}>
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
        deleteItem && (owner || canDelete) && (
          <Button
            variant="contained"
            color="secondary"
            onClick={deleteItem(itemObject.id)}
            name={`${itemObject.name}-delete`}
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

ListItem.defaultProps = {
  owner: false,
  highlight: false,
  linkButtonText: null,
  linkButtonColor: null,
  deleteButtonText: null,
  deleteItem: null,
  canDelete: false,
};

ListItem.propTypes = {
  canDelete: PropTypes.bool,
  classes: PropTypes.object.isRequired,
  deleteButtonText: PropTypes.string,
  highlight: PropTypes.bool,
  itemObject: PropTypes.object.isRequired,
  itemOptions: PropTypes.object.isRequired,
  itemRoute: PropTypes.string.isRequired,
  linkButtonColor: PropTypes.string,
  linkButtonText: PropTypes.string,
  owner: PropTypes.bool,
  deleteItem: PropTypes.func,
};

export default withStyles(styles)(ListItem);
