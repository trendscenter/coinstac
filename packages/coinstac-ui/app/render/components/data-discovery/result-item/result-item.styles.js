import { makeStyles } from '@material-ui/core/styles';

export default makeStyles(theme => ({
  root: {
    padding: theme.spacing(2),
  },
  label: {
    fontWeight: 'bold',
    marginRight: theme.spacing(1),
  },
  avatar: {
    margin: 0,
    marginBottom: theme.spacing(1),
  },
  detailsButton: {
    marginTop: theme.spacing(1),
  },
}));
