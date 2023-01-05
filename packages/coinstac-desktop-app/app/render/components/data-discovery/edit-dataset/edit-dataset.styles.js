import { makeStyles } from '@material-ui/core/styles';

export default makeStyles(theme => ({
  field: {
    marginTop: theme.spacing(3),
  },
  successIcon: {
    color: '#43a047',
  },
  statusMessage: {
    marginLeft: theme.spacing(0.5),
  },
  info: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    background: theme.palette.info.main,
    color: theme.palette.info.contrastText,
  },
}));
