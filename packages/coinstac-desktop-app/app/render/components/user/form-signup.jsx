import React from 'react';
import PropTypes from 'prop-types';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import makeStyles from '@material-ui/core/styles/makeStyles';
import classNames from 'classnames';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { PASSWORD_PATTERN } from '../../constants';

const validationSchema = Yup.object().shape({
  name: Yup.string().required('Required'),
  username: Yup.string().required('Required'),
  email: Yup.string().email('Invalid email').required('Required'),
  password: Yup.string().required('Required').matches(PASSWORD_PATTERN, {
    message: 'Passwords should be 8 character minimum with a mix of uppercase, lowercase and special character',
  }),
  confirmPassword: Yup.string().required('Required').oneOf([Yup.ref('password')], 'Your passwords do not match.'),
});

const useStyles = makeStyles(theme => ({
  bottomMargin: {
    marginBottom: 10,
  },
  paper: {
    padding: theme.spacing(2),
    maxWidth: 300,
    marginBottom: theme.spacing(2),
  },
  formControl: {
    marginBottom: theme.spacing(2),
  },
  error: {
    textAlign: 'center',
    color: 'red',
  },
}));

const FormSignup = ({
  auth,
  error,
  onSubmit,
}) => {
  const classes = useStyles();

  const formik = useFormik({
    initialValues: {
      name: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validationSchema,
    onSubmit: (values) => {
      onSubmit({
        institution: 'mrn',
        name: values.name.trim(),
        username: values.username.trim(),
        email: values.email.trim(),
        password: values.password.trim(),
      });
    },
  });

  return (
    <Paper className={classes.paper}>
      <form onSubmit={formik.handleSubmit}>
        {error && (
          <p className={classNames(classes.bottomMargin, classes.error)}>
            {error}
          </p>
        )}
        {!auth.isApiVersionCompatible && (
          <p className={classNames(classes.bottomMargin, classes.error)}>
            This Coinstac version is not compatible with the API.
          </p>
        )}
        <TextField
          id="name"
          name="name"
          label="Name"
          fullWidth
          className={classes.formControl}
          value={formik.values.name}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.name && Boolean(formik.errors.name)}
          helperText={formik.touched.name && formik.errors.name}
        />
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
        <TextField
          id="password"
          name="password"
          label="Password"
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
          color="primary"
          type="submit"
          fullWidth
        >
          Sign Up
        </Button>
      </form>
    </Paper>
  );
};

FormSignup.displayName = 'FormSignup';

FormSignup.defaultProps = {
  error: null,
};

FormSignup.propTypes = {
  auth: PropTypes.object.isRequired,
  error: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
};

export default FormSignup;
