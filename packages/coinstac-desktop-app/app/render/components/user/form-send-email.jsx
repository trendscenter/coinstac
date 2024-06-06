import Button from '@material-ui/core/Button';
import makeStyles from '@material-ui/core/styles/makeStyles';
import TextField from '@material-ui/core/TextField';
import { useFormik } from 'formik';
import PropTypes from 'prop-types';
import React from 'react';
import * as Yup from 'yup';

const validationSchema = Yup.object().shape({
  emailOrUsername: Yup.string().required('Required'),
});

const useStyles = makeStyles(theme => ({
  paper: {
    padding: theme.spacing(2),
    maxWidth: 300,
    marginBottom: theme.spacing(2),
  },
  formControl: {
    marginBottom: theme.spacing(2),
  },
}));

const FormSendEmail = ({
  loading,
  onSubmit,
}) => {
  const classes = useStyles();

  const formik = useFormik({
    initialValues: {
      emailOrUsername: '',
    },
    validationSchema,
    onSubmit: (values) => {
      onSubmit({
        emailOrUsername: values.emailOrUsername.trim(),
      });
    },
  });

  return (
    <form onSubmit={formik.handleSubmit}>
      <TextField
        id="emailOrUsername"
        name="emailOrUsername"
        label="Email or Username"
        fullWidth
        className={classes.formControl}
        value={formik.values.emailOrUsername}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.emailOrUsername && Boolean(formik.errors.emailOrUsername)}
        helperText={formik.touched.emailOrUsername && formik.errors.emailOrUsername}
      />
      <Button
        variant="contained"
        color="secondary"
        type="submit"
        fullWidth
        disabled={loading}
      >
        Send
      </Button>
    </form>
  );
};

FormSendEmail.propTypes = {
  loading: PropTypes.bool,
  onSubmit: PropTypes.func.isRequired,
};

FormSendEmail.defaultProps = {
  loading: false,
};

export default FormSendEmail;
