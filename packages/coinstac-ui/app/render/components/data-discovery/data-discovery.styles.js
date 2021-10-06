import { makeStyles } from '@material-ui/core/styles';

export default makeStyles(theme => ({
  searchButton: {
    marginTop: theme.spacing(2),
  },
  resultItem: {
    marginBottom: theme.spacing(2),
  },
  firstSearchInfo: {
    padding: theme.spacing(2),
    background: theme.palette.info.main,
    color: theme.palette.info.contrastText,
  },
}));
