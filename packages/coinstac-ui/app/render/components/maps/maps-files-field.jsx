import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import FilePicker from '../common/file-picker';

const styles = theme => ({
  rootPaper: {
    ...theme.mixins.gutters(),
    paddingTop: theme.spacing(1.5),
    paddingBottom: theme.spacing(1.5),
    marginTop: theme.spacing(1.5),
  },
  capitalize: {
    textTransform: 'capitalize',
  },
});

function MapsFilesField({ fieldName, onChange, classes }) {
  function setSelectedFiles(files) {
    onChange(fieldName, { files });
  }

  return (
    <Paper className={classes.rootPaper} elevation={2}>
      <Typography variant="h4" className={classes.capitalize}>
        { fieldName }
      </Typography>
      <FilePicker
        multiple
        filterName="csv,txt files"
        extensions={['csv', 'txt']}
        onChange={files => setSelectedFiles(files)}
      />
    </Paper>
  );
}

MapsFilesField.propTypes = {
  classes: PropTypes.object.isRequired,
  fieldName: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};


export default withStyles(styles)(MapsFilesField);
