import { makeStyles } from '@material-ui/core/styles';

export default makeStyles(theme => ({
  root: {
    padding: theme.spacing(2),
    backgroundColor: '#F05A28',
    transition: 'all 0.5s ease-out',
  },
  titleBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
  },
  title: {
    color: '#f5f5f5',
  },
  hide: {
    maxHeight: 0,
    padding: 0,
  },
  show: {
    maxHeight: '300px',
  },
}));
