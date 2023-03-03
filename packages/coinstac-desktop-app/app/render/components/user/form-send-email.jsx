import React from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import makeStyles from '@material-ui/core/styles/makeStyles';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const validationSchema = Yup.object().shape({
  email: Yup.string().required('Required').email('Invalid email'),
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
      email: '',
    },
    validationSchema,
    onSubmit: (values) => {
      onSubmit({
        email: values.email.trim(),
      });
    },
  });

  return (
    <form onSubmit={formik.handleSubmit}>
      <TextField
        id="email"
        name="email"
        label="Email"
        fullWidth
        className={classes.formControl}
        value={formik.values.email}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.email && Boolean(formik.errors.email)}
        helperText={formik.touched.email && formik.errors.email}
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
  loading: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
};

FormSendEmail.defaultProps = {
  loading: null,
};

export default FormSendEmail;
