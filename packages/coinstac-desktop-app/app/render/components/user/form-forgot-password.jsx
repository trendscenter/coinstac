import React from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import makeStyles from '@material-ui/core/styles/makeStyles';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { PASSWORD_PATTERN } from '../../constants';

const validationSchema = Yup.object().shape({
  token: Yup.string().required('Required'),
  password: Yup.string().required('Required').matches(PASSWORD_PATTERN, {
    message: 'Passwords should be 8 character minimum with a mix of uppercase, lowercase and special character',
  }),
  confirmPassword: Yup.string().required('Required').oneOf([Yup.ref('password')], 'Your passwords do not match.'),
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

const FormForgotPassword = ({
  loading,
  onSubmit,
}) => {
  const classes = useStyles();

  const formik = useFormik({
    initialValues: {
      token: '',
      password: '',
      confirmPassword: '',
    },
    validationSchema,
    onSubmit: (values) => {
      onSubmit({
        token: values.token.trim(),
        password: values.password.trim(),
      });
    },
  });

  return (
    <form onSubmit={formik.handleSubmit}>
      <TextField
        id="token"
        name="token"
        label="Password Reset Token"
        fullWidth
        className={classes.formControl}
        value={formik.values.token}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.token && Boolean(formik.errors.token)}
        helperText={formik.touched.token && formik.errors.token}
      />
      <TextField
        id="password"
        name="password"
        label="New Password"
        type="password"
        fullWidth
        className={classes.formControl}
        value={formik.values.password}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.password && Boolean(formik.errors.password)}
        helperText={formik.touched.password && formik.errors.password}
      />
      <TextField
        id="confirmPassword"
        name="confirmPassword"
        label="Confirm Password"
        type="password"
        fullWidth
        className={classes.formControl}
        value={formik.values.confirmPassword}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
        helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
      />
      <Button
        variant="contained"
        color="secondary"
        type="submit"
        fullWidth
        disabled={loading}
      >
        Reset
      </Button>
    </form>
  );
};

FormForgotPassword.propTypes = {
  loading: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
};

FormForgotPassword.defaultProps = {
  loading: null,
};

export default FormForgotPassword;
