import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import makeStyles from '@material-ui/core/styles/makeStyles';
import classNames from 'classnames';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import FormStartupDirectory from './form-startup-directory';
import { EXPIRED_TOKEN } from '../../utils/error-codes';

const validationSchema = Yup.object().shape({
  username: Yup.string().required('Required'),
  password: Yup.string().required('Required'),
});

const useStyles = makeStyles(theme => ({
  loginFormContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  paper: {
    padding: theme.spacing(2),
    maxWidth: 300,
    marginBottom: theme.spacing(2),
  },
  bottomMargin: {
    marginBottom: 10,
  },
  formControl: {
    marginBottom: theme.spacing(2),
  },
  error: {
    textAlign: 'center',
    color: 'red',
  },
}));

const FormLogin = ({
  auth,
  loading,
  changeAppDirectory,
  changeClientServerURL,
  onSubmit,
}) => {
  const classes = useStyles();

  const [isStartupDirectoryDialogOpen, setIsStartupDirectoryDialogOpen] = useState(false);

  const formik = useFormik({
    initialValues: {
      username: '',
      password: '',
      saveLogin: false,
    },
    validationSchema,
    onSubmit: (values) => {
      onSubmit({
        username: values.username.trim(),
        password: values.password.trim(),
        saveLogin: values.saveLogin,
      });
    },
  });


  const toggleStartupDirectoryDialog = () => {
    setIsStartupDirectoryDialogOpen(prevState => !prevState);
  };

  const changeAppData = ({ appDirectory, clientServerURL }) => {
    changeAppDirectory(appDirectory);
    changeClientServerURL(clientServerURL);
    setIsStartupDirectoryDialogOpen(false);
  };

  const renderError = () => {
    const errorMessage = auth.error === EXPIRED_TOKEN
      ? (
        <>
          Your login session has expired,
          <br />
          please re-login
        </>
      )
      : auth.error;

    return (
      <p className={classNames(classes.bottomMargin, classes.error)}>
        {errorMessage}
      </p>
    );
  };

  return (
    <div className={classes.loginFormContainer}>
      <Paper className={classes.paper}>
        <form onSubmit={formik.handleSubmit}>
          { auth.error && renderError() }
          {
            !auth.isApiVersionCompatible
            && (
              <p className={classNames(classes.bottomMargin, classes.error)}>
                This Coinstac version is not compatible with the API.
              </p>
            )
          }
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
          <FormControlLabel
            control={(
              <Checkbox
                id="saveLogin"
                name="saveLogin"
                checked={formik.values.saveLogin}
                onChange={formik.handleChange}
              />
            )}
            label="Keep me logged in"
            className={classes.formControl}
          />
          <Button
            variant="contained"
            color="secondary"
            type="submit"
            fullWidth
            disabled={loading.isLoading || !auth.isApiVersionCompatible}
          >
            Log In
          </Button>
        </form>
      </Paper>

      <Button
        component={Link}
        to="/forgot-password"
        color={window.location.href.includes('/forgot-password') ? 'primary' : 'default'}
      >
        Forgot Password?
      </Button>

      <Button
        onClick={toggleStartupDirectoryDialog}
        disabled={!auth.isApiVersionCompatible}
      >
        Change App Settings
      </Button>
      <FormStartupDirectory
        appDirectory={auth.appDirectory}
        clientServerURL={auth.clientServerURL}
        open={isStartupDirectoryDialogOpen}
        onSubmit={changeAppData}
        close={toggleStartupDirectoryDialog}
      />
    </div>
  );
};

FormLogin.propTypes = {
  auth: PropTypes.object.isRequired,
  loading: PropTypes.object,
  changeAppDirectory: PropTypes.func.isRequired,
  changeClientServerURL: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

FormLogin.defaultProps = {
  loading: null,
};

export default FormLogin;
