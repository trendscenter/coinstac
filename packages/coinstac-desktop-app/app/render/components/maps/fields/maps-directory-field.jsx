import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import FilePicker from '../../common/file-picker';

const styles = theme => ({
  rootPaper: {
    ...theme.mixins.gutters(),
    paddingTop: theme.spacing(1.5),
    paddingBottom: theme.spacing(1.5),
    marginTop: theme.spacing(1.5),
  },
  header: {
    textTransform: 'capitalize',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

function MapsDirectoryField({
  fieldName, fieldDataMap, fieldDescription, onChange, classes,
}) {
  function setSelectedDirectory(selected) {
    if (!selected || !selected.length) {
      return;
    }

    onChange(fieldName, { fieldType: fieldDescription.type, directory: selected[0] });
  }

  function deleteDirectory() {
    onChange(fieldName, { fieldType: fieldDescription.type, directory: '' });
  }

  return (
    <div>
      <Typography variant="h4" className={classes.header}>
        {fieldName}
      </Typography>
      <FilePicker
        directory
        onChange={setSelectedDirectory}
        selected={fieldDataMap && fieldDataMap.directory ? [fieldDataMap.directory] : []}
        deleteItem={deleteDirectory}
      />
    </div>
  );
}

MapsDirectoryField.propTypes = {
  classes: PropTypes.object.isRequired,
  fieldName: PropTypes.string.isRequired,
  fieldDataMap: PropTypes.object,
  fieldDescription: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};

MapsDirectoryField.defaultProps = {
  fieldDataMap: null,
};

export default withStyles(styles)(MapsDirectoryField);
