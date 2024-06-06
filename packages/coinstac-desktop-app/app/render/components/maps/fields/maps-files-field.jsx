import makeStyles from '@material-ui/core/styles/makeStyles';
import Typography from '@material-ui/core/Typography';
import PropTypes from 'prop-types';
import React from 'react';

import FilePicker from '../../common/file-picker';

const useStyles = makeStyles(theme => ({
  rootPaper: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    paddingTop: theme.spacing(1.5),
    paddingBottom: theme.spacing(1.5),
    marginTop: theme.spacing(1.5),
    [theme.breakpoints.up('sm')]: {
      paddingLeft: theme.spacing(3),
      paddingRight: theme.spacing(3),
    },
  },
  header: {
    textTransform: 'capitalize',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
}));

function MapsFilesField({
  fieldName, fieldDataMap, fieldDescription, onChange,
}) {
  const classes = useStyles();

  function setSelectedFiles(selectedFiles) {
    onChange(fieldName, { fieldType: fieldDescription.type, files: selectedFiles });
  }

  function appendSelectedFiles(selectedFiles) {
    let files;
    if (fieldDataMap && fieldDataMap.files && fieldDataMap.files.length > 0) {
      files = fieldDataMap.files.concat(selectedFiles);
    } else {
      files = selectedFiles;
    }

    setSelectedFiles(files);
  }

  function deleteFile(fileIndex) {
    const newFiles = fieldDataMap.files.filter((f, i) => i !== fileIndex);
    setSelectedFiles(newFiles);
  }

  return (
    <div>
      <Typography variant="h4" className={classes.header}>
        {fieldName}
      </Typography>
      <FilePicker
        multiple
        filterName="csv,txt,gz,nii files"
        extensions={fieldDescription.extensions}
        onChange={files => appendSelectedFiles(files)}
        selected={fieldDataMap && fieldDataMap.files ? fieldDataMap.files : []}
        deleteItem={fileIndex => deleteFile(fileIndex)}
      />
    </div>
  );
}

MapsFilesField.propTypes = {
  fieldName: PropTypes.string.isRequired,
  fieldDataMap: PropTypes.object,
  fieldDescription: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};

MapsFilesField.defaultProps = {
  fieldDataMap: null,
};

export default MapsFilesField;
