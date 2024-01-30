import React from 'react';
import { Link } from 'react-router';
import PropTypes from 'prop-types';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import DeleteIcon from '@material-ui/icons/Delete';
import makeStyles from '@material-ui/core/styles/makeStyles';

const useStyles = makeStyles(theme => ({
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
  ownerBadge: {
    background: 'rgb(103, 174, 63)',
    color: 'white',
    padding: '0.5rem 1rem 0',
    marginTop: '-1rem',
    lineHeight: '2',
  },
}));

function ListItem({
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
  hideDetailButton,
}) {
  const classes = useStyles();

  if (!itemObject) {
    return null;
  }

  return (
    <Paper
      id={itemObject.id}
      key={`${itemObject.id}-list-item`}
      className={classes.rootPaper}
      elevation={4}
    >
      <div className={classes.titleContainer}>
        <Typography variant="h5" className={highlight ? classes.highlight : ''}>
          {itemObject.name}
        </Typography>
        {itemOptions.owner && <Typography className={classes.ownerBadge}>Owner</Typography>}
      </div>
      <Typography variant="body2" className={classes.description}>
        {itemObject.description}
      </Typography>
      {itemOptions.text}
      <div className={classes.listItemActions}>
        <div className={classes.listItemActionsPrimary}>
          {!hideDetailButton && (
            <Button
              variant="contained"
              color={linkButtonColor || 'primary'}
              component={Link}
              to={`${itemRoute}/${itemObject.id}`}
              name={itemObject.name}
              className={classes.button}
            >
              {linkButtonText || 'View Details'}
            </Button>
          )}
          {itemOptions.actions}
        </div>
        {deleteItem && (owner || canDelete) && (
          <Button
            variant="contained"
            color="secondary"
            onClick={deleteItem(itemObject.id)}
            name={`${itemObject.name}-delete`}
            className={classes.deleteButton}
          >
            {deleteButtonText || 'Delete'}
            <DeleteIcon />
          </Button>
        )}
        {itemOptions.status}
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
  itemOptions: {},
  hideDetailButton: false,
};

ListItem.propTypes = {
  canDelete: PropTypes.bool,
  deleteButtonText: PropTypes.string,
  highlight: PropTypes.bool,
  itemObject: PropTypes.object.isRequired,
  itemOptions: PropTypes.object,
  itemRoute: PropTypes.string.isRequired,
  linkButtonColor: PropTypes.string,
  linkButtonText: PropTypes.string,
  owner: PropTypes.bool,
  hideDetailButton: PropTypes.bool,
  deleteItem: PropTypes.func,
};

export default ListItem;
