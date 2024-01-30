import React, { useState } from 'react';
import PropTypes from 'prop-types';
import makeStyles from '@material-ui/core/styles/makeStyles';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import TextField from '@material-ui/core/TextField';

const useStyles = makeStyles(theme => ({
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
  required: {
    fontWeight: 'normal',
    textAlign: 'left',
    display: 'inline-flex',
    width: 'auto',
    flexDirection: 'row',
    flexGrow: 1,
    paddingLeft: '0.5rem',
    fontSize: '0.75rem',
    color: 'red',
  },
}));


function MapsTextField({
  fieldName, fieldDataMap, fieldDescription, onChange,
}) {
  const classes = useStyles();

  const initialVal = fieldDataMap && fieldDataMap.value ? fieldDataMap.value : null;
  const [val, setVal] = useState(initialVal);
  const [useDefault, setUseDefault] = useState(false);

  function changeHandler(e) {
    setVal(e.target.value);
    const value = fieldDescription.type === 'number' ? parseInt(e.target.value, 10) : e.target.value;
    onChange(
      fieldName,
      {
        fieldType: fieldDescription.type,
        required: fieldDescription.required,
        value,
      }
    );
  }

  function defaultHandler() {
    setUseDefault(!useDefault);
    if (!useDefault) {
      setVal(fieldDescription.default);
      onChange(fieldName, { fieldType: fieldDescription.type, value: fieldDescription.default });
    }
  }

  return (
    <div>
      <Typography variant="h6" className={classes.header}>
        {fieldDescription.label}
        {fieldDescription.required ? (
          <span className={classes.required}>
            (Input Required)
          </span>) : ''}
      </Typography>
      <TextField
        disabled={useDefault}
        type={fieldDescription.type}
        onChange={e => changeHandler(e)}
        value={val}
        placeholder={val || fieldDescription.default}
      />
      {fieldDescription.default && (
        <FormControlLabel
          control={(
            <Checkbox
              checked={useDefault}
              onChange={e => defaultHandler(e)}
              value={useDefault}
            />
          )}
          label={
            <Box component="div" fontSize={15} style={{ color: '#b7b7b7' }}>Use Default</Box>
          }
        />)
      }
    </div>
  );
}

MapsTextField.propTypes = {
  fieldName: PropTypes.string.isRequired,
  fieldDataMap: PropTypes.object,
  fieldDescription: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};

MapsTextField.defaultProps = {
  fieldDataMap: null,
};

export default MapsTextField;
