import { makeStyles } from '@material-ui/core/styles';

export default makeStyles(theme => ({
  info: {
    margin: theme.spacing(2, 0),
    padding: theme.spacing(2),
    background: theme.palette.info.main,
    color: theme.palette.info.contrastText,
  },
}));
