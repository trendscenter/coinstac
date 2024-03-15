import Box from '@material-ui/core/Box';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import makeStyles from '@material-ui/core/styles/makeStyles';
import Typography from '@material-ui/core/Typography';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import JSONInput from 'react-json-editor-ajrm';
import locale from 'react-json-editor-ajrm/locale/en';

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

function MapsObjectField({
  fieldName, fieldDataMap, fieldDescription, onChange,
}) {
  const classes = useStyles();

  const initialVal = fieldDataMap && fieldDataMap.value ? fieldDataMap.value : null;
  const [val, setVal] = useState(initialVal);
  const [useDefault, setUseDefault] = useState(false);

  function changeHandler(e) {
    setVal(e.target.value);
    const value = fieldDescription.type === 'number' ? parseInt(e.target.value, 10) : e.target.value;
    onChange(fieldName, { fieldType: fieldDescription.type, value });
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
      <JSONInput
        disabled={useDefault}
        onChange={e => changeHandler(e)}
        value={val}
        placeholder={val || fieldDescription.default}
        locale={locale}
        height="250px"
        theme="light_mitsuketa_tribute"
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

MapsObjectField.propTypes = {
  fieldName: PropTypes.string.isRequired,
  fieldDataMap: PropTypes.object,
  fieldDescription: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};

MapsObjectField.defaultProps = {
  fieldDataMap: null,
};

export default MapsObjectField;
