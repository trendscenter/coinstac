import React, { useState } from 'react';
import PropTypes from 'prop-types';
import makeStyles from '@material-ui/core/styles/makeStyles';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';

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
}));


function MapsBooleanField({
  fieldName, fieldDataMap, fieldDescription, onChange,
}) {
  const classes = useStyles();

  const initialVal = fieldDataMap && fieldDataMap.value ? fieldDataMap.value : null;
  const [val, setVal] = useState(initialVal);
  const [useDefault, setUseDefault] = useState(false);

  function changeHandler() {
    setVal(!val);
    onChange(fieldName, { fieldType: fieldDescription.type, value: !val });
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
      </Typography>
      <Switch
        onChange={e => changeHandler(e)}
        value={val || fieldDescription.default}
        checked={val || fieldDescription.default}
      />
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
      />
    </div>
  );
}

MapsBooleanField.propTypes = {
  fieldName: PropTypes.string.isRequired,
  fieldDataMap: PropTypes.object,
  fieldDescription: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};

MapsBooleanField.defaultProps = {
  fieldDataMap: null,
};

export default MapsBooleanField;
