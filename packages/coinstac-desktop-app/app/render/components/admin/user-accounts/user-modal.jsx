import { makeStyles } from '@material-ui/core';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import { isEqual } from 'lodash';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { ValidatorForm, TextValidator } from 'react-material-ui-form-validator';

const useStyles = makeStyles(theme => ({
  dialogTitle: {
    paddingBottom: 0,
  },
  dialogActions: {
    padding: `${theme.spacing(2)}px ${theme.spacing(3)}px`,
  },
  input: {
    width: '100%',
  },
}));

const UserModal = ({ initialValues, onSave, onClose }) => {
  const classes = useStyles();

  const [values, setValues] = useState({});

  useEffect(() => {
    if (!isEqual(initialValues, values)) {
      setValues(initialValues);
    }
  }, [initialValues]);

  const handleUpdateValue = (key, value) => {
    setValues(prevState => ({ ...prevState, [key]: value }));
  };

  const handleSubmit = () => {
    onSave(values)
  };

  return (
    <Dialog open maxWidth="xs" fullWidth>
      <DialogTitle className={classes.dialogTitle}>
        {values.id ? 'Create user' : 'Edit user'}
      </DialogTitle>
      <DialogContent>
        <ValidatorForm
          instantValidate
          noValidate
          onSubmit={handleSubmit}
        >
          <Box display="flex" flexDirection="column" gridRowGap={12}>
            <TextValidator
              id="username"
              name="username"
              className={classes.input}
              label="Username"
              value={values.username}
              validators={['required']}
              errorMessages={['Username is required']}
              withRequiredValidator
              required
              onChange={evt => handleUpdateValue('username', evt.target.value)}
            />
            <TextValidator
              id="email"
              name="email"
              className={classes.input}
              label="Email"
              value={values.email}
              validators={['required']}
              errorMessages={['Email is required']}
              withRequiredValidator
              required
              onChange={evt => handleUpdateValue('email', evt.target.value)}
            />
            <TextValidator
              id="name"
              name="name"
              className={classes.input}
              label="Name"
              value={values.name}
              validators={['required']}
              errorMessages={['Name is required']}
              withRequiredValidator
              required
              onChange={evt => handleUpdateValue('name', evt.target.value)}
            />
            <TextValidator
              id="institution"
              name="institution"
              className={classes.input}
              label="Institution"
              value={values.institution}
              validators={['required']}
              errorMessages={['Institution is required']}
              withRequiredValidator
              required
              onChange={evt => handleUpdateValue('institution', evt.target.value)}
            />
          </Box>
          <Box
            display="flex"
            justifyContent="flex-end"
            gridColumnGap={8}
            paddingTop={2}
            paddingBottom={1}
          >
            <Button type="submit" variant="contained" color="primary">
              Save
            </Button>
            <Button variant="contained" color="secondary" onClick={onClose}>
              Cancel
            </Button>
          </Box>
        </ValidatorForm>
      </DialogContent>
    </Dialog>
  );
};

UserModal.propTypes = {
  initialValues: PropTypes.object.isRequired,
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default UserModal;
