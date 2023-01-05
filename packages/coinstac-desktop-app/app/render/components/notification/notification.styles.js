import { makeStyles } from '@material-ui/core/styles';

export default makeStyles(() => ({
  root: props => ({
    bottom: 24 + (58 * props.index),
  }),
}));
