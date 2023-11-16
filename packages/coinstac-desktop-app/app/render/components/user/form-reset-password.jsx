import React from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import makeStyles from '@material-ui/core/styles/makeStyles';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { PASSWORD_PATTERN } from '../../constants';

const validationSchema = Yup.object().shape({
  username: Yup.string().required('Required'),
  currentPassword: Yup.string().required('Required'),
  newPassword: Yup.string().required('Required').matches(PASSWORD_PATTERN, {
    message: 'Passwords should be 8 character minimum with a mix of uppercase, lowercase and special character',
  }),
  confirmPassword: Yup.string().required('Required').oneOf([Yup.ref('newPassword')], 'Your passwords do not match.'),
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

const FormResetPassword = ({
  loading,
  onSubmit,
}) => {
  const classes = useStyles();

  const formik = useFormik({
    initialValues: {
      username: '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema,
    onSubmit: (values) => {
      onSubmit({
        username: values.username.trim(),
        currentPassword: values.currentPassword.trim(),
        newPassword: values.newPassword.trim(),
      });
    },
  });

  return (
    <form onSubmit={formik.handleSubmit}>
      <TextField
        id="username"
        name="username"
        label="Username"
        fullWidth
        className={classes.formControl}
        value={formik.values.username}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.username && Boolean(formik.errors.username)}
        helperText={formik.touched.username && formik.errors.username}
      />
      <TextField
        id="currentPassword"
        name="currentPassword"
        label="Current Password"
        type="password"
        fullWidth
        className={classes.formControl}
        value={formik.values.currentPassword}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.currentPassword && Boolean(formik.errors.currentPassword)}
        helperText={formik.touched.currentPassword && formik.errors.currentPassword}
      />
      <TextField
        id="newPassword"
        name="newPassword"
        label="New Password"
        type="password"
        fullWidth
        className={classes.formControl}
        value={formik.values.newPassword}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.newPassword && Boolean(formik.errors.newPassword)}
        helperText={formik.touched.newPassword && formik.errors.newPassword}
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

FormResetPassword.propTypes = {
  loading: PropTypes.bool,
  onSubmit: PropTypes.func.isRequired,
};

FormResetPassword.defaultProps = {
  loading: false,
};

export default FormResetPassword;
