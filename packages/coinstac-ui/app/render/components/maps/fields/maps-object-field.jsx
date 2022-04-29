import React, { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import JSONInput from 'react-json-editor-ajrm';
import locale from 'react-json-editor-ajrm/locale/en';

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


function MapsObjectField({
  fieldName, fieldDataMap, fieldDescription, onChange, classes,
}) {
  const initialVal = useMemo(() => {
    if (!fieldDataMap) return fieldDescription.default || {};
    return fieldDataMap.value;
  }, []);

  useEffect(() => {
    // call the on change in the first render to set the default value
    if (!fieldDataMap && fieldDescription.default) {
      onChange(fieldName, { fieldType: fieldDescription.type, value: fieldDescription.default });
    }
  }, []);

  function handleJsonInputChange(value) {
    onChange(fieldName, { fieldType: fieldDescription.type, value: value.jsObject });
  }

  return (
    <div>
      <Typography variant="h6" className={classes.header}>
        {fieldDescription.label}
      </Typography>
      <JSONInput
        onChange={handleJsonInputChange}
        placeholder={initialVal}
        locale={locale}
        height="250px"
        theme="light_mitsuketa_tribute"
      />
    </div>
  );
}

MapsObjectField.propTypes = {
  classes: PropTypes.object.isRequired,
  fieldName: PropTypes.string.isRequired,
  fieldDataMap: PropTypes.object,
  fieldDescription: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};

MapsObjectField.defaultProps = {
  fieldDataMap: null,
};

export default withStyles(styles)(MapsObjectField);
