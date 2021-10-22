import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Checkbox from '@material-ui/core/Checkbox';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';

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
  successIcon: {
    width: 40,
    height: 40,
    color: '#43a047',
  },
});


function MapsBooleanField({
  fieldName, fieldDataMap, fieldDescription, onChange, classes,
}) {

  const initialVal = fieldDataMap && fieldDataMap.value ? fieldDataMap.value : null;
  const [val, setVal] = useState(initialVal);
  const [useDefault, setUseDefault] = useState(false);

  function changeHandler(e) {
    setVal(!val);
    onChange(fieldName, { fieldType: fieldDescription.type, value: !val });
  }

  function defaultHandler(e) {
    setUseDefault(!useDefault);
    if (!useDefault) {
      setVal(fieldDescription.default);
      onChange(fieldName, { fieldType: fieldDescription.type, value: fieldDescription.default });
    }
  }

  function isMapped() {
    if (fieldDataMap) {
      return true;
    }
  }

  return (
    <div>
      <Typography variant="h6" className={classes.header}>
        {fieldDescription.label}
        {isMapped() && <CheckCircleIcon className={classes.successIcon} />}
      </Typography>
      <Switch
        onChange={e => changeHandler(e)}
        value = {val ? val : fieldDescription.default}
        checked = {val ? val : fieldDescription.default}
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
          <Box component="div" fontSize={15} style={{color: '#b7b7b7'}}>Use Default</Box>
        }
      />
  </div>
  );
}

MapsBooleanField.propTypes = {
  classes: PropTypes.object.isRequired,
  fieldName: PropTypes.string.isRequired,
  fieldDataMap: PropTypes.object,
  fieldDescription: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};

MapsBooleanField.defaultProps = {
  fieldDataMap: null,
};

export default withStyles(styles)(MapsBooleanField);
