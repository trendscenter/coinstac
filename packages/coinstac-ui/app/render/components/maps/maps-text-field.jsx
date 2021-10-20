import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import TextField from '@material-ui/core/TextField';

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


function MapsTextField({
  fieldName, fieldDataMap, fieldDescription, onChange, classes,
}) {
  const [val, setVal] = useState(null);

  function changeHandler(e) {
    setVal(e.target.value);
    onChange(fieldName, e.target.value);
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
      <TextField
        onChange={e => changeHandler(e)}
        value = { val ? val : '' }
        placeholder = {fieldDescription.default.toString()}
      />
  </div>
  );
}

MapsTextField.propTypes = {
  classes: PropTypes.object.isRequired,
  fieldName: PropTypes.string.isRequired,
  fieldDataMap: PropTypes.object,
  fieldDescription: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};

MapsTextField.defaultProps = {
  fieldDataMap: null,
};

export default withStyles(styles)(MapsTextField);
