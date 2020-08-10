import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { compose, graphql, withApollo } from 'react-apollo';
import { get } from 'lodash';
import { Button, CircularProgress, Typography } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { ValidatorForm, TextValidator } from 'react-material-ui-form-validator';
import { updatePasswordProps } from '../../state/graphql/props';
import { UPDATE_PASSWORD_MUTATION } from '../../state/graphql/functions';
import { notifySuccess, notifyInfo, notifyError } from '../../state/ducks/notifyAndLog';
import { clearRuns } from '../../state/ducks/runs';
import UserEditController from './user-edit-controller';

const styles = theme => ({
  pageTitle: {
    marginBottom: theme.spacing(2),
  },
  removeDataTitle: {
    marginBottom: theme.spacing.unit,
  },
  updatePasswordTitle: {
    marginTop: theme.spacing.unit * 5,
    marginBottom: theme.spacing.unit,
  },
  sectionTitle: {
    marginBottom: theme.spacing(1),
  },
  button: {
    marginTop: theme.spacing(1),
  },
  formControl: {
    marginBottom: theme.spacing.unit,
    display: 'block',
  },
  spinner: {
    color: theme.palette.grey[500],
    marginLeft: theme.spacing.unit * 2,
  },
  buttonWrapper: {
    display: 'flex',
    alignItems: 'center',
    marginTop: theme.spacing.unit * 2,
  },
});

const INITIAL_STATE = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
  isUpdating: false,
};

class Settings extends Component {
  constructor(props) {
    super(props);

    this.state = INITIAL_STATE;
  }

  componentDidMount() {
    ValidatorForm.addValidationRule(
      'isPasswordMatch',
      // eslint-disable-next-line react/destructuring-assignment
      value => value === this.state.newPassword
    );
  }

  componentWillUnmount() {
    ValidatorForm.removeValidationRule('isPasswordMatch');
  }

  clearData = (e) => {
    const { clearRuns, notifyInfo } = this.props;
    e.preventDefault();

    clearRuns();
    notifyInfo('Local data cleared');
  }

  updatePassword = () => {
    const { currentPassword, newPassword, isUpdating } = this.state;
    const { updatePassword, notifySuccess, notifyError } = this.props;

    if (isUpdating) {
      return;
    }

    this.setState({ isUpdating: true });

    updatePassword({ currentPassword, newPassword })
      .then(() => {
        notifySuccess('Password updated successfully');
        this.setState(INITIAL_STATE);
        this.passwordResetForm.resetValidations();
      })
      .catch(({ graphQLErrors }) => {
        notifyError(get(graphQLErrors, '0.message', 'Failed to update password'));
      })
      .finally(() => {
        this.setState({ isUpdating: false });
      });
  }

  updatePasswordParam = ({ param, value }) => {
    this.setState({ [param]: value });
  }

  render() {
    const { classes } = this.props;
    const {
      currentPassword, newPassword, confirmPassword, isUpdating,
    } = this.state;

    return (
      <div className="settings">
        <div className="page-header">
          <Typography variant="h4" className={classes.pageTitle}>
            Settings
          </Typography>
        </div>
<<<<<<< HEAD
        <UserEditController />
        <hr />
        <Typography variant="h5" className={classes.pageSubtitle}>
=======
        <Typography variant="h5" className={classes.removeDataTitle}>
>>>>>>> master
          Remove Data
        </Typography>
        <form method="post" onSubmit={this.clearData}>
          <Typography variant="h6" className={classes.sectionTitle}>Clear local data</Typography>
          <Typography variant="body2">
            Remove stored data on your machine, including your collections.
            <strong> This action is permanent.</strong>
          </Typography>
          <Button variant="contained" color="secondary" type="submit" className={classes.button}>
            Delete Local Data
          </Button>
        </form>

        <Typography variant="h5" className={classes.updatePasswordTitle}>
          Update Password
        </Typography>

        <ValidatorForm
          instantValidate
          noValidate
          ref={(ref) => { this.passwordResetForm = ref; }}
          onSubmit={this.updatePassword}
        >
          <TextValidator
            className={classes.formControl}
            type="password"
            label="Current Password"
            value={currentPassword}
            validators={['required']}
            errorMessages={['Current password is required']}
            withRequiredValidator
            required
            onChange={evt => this.updatePasswordParam({
              param: 'currentPassword', value: evt.target.value,
            })}
          />
          <TextValidator
            className={classes.formControl}
            type="password"
            label="New Password"
            value={newPassword}
            validators={['required']}
            errorMessages={['New password is required']}
            withRequiredValidator
            required
            onChange={evt => this.updatePasswordParam({
              param: 'newPassword', value: evt.target.value,
            })}
          />
          <TextValidator
            className={classes.formControl}
            type="password"
            label="Confirm Password"
            value={confirmPassword}
            validators={['isPasswordMatch', 'required']}
            errorMessages={['Password mismatch', 'Confirm password is required']}
            withRequiredValidator
            required
            onChange={evt => this.updatePasswordParam({
              param: 'confirmPassword', value: evt.target.value,
            })}
          />
          <div className={classes.buttonWrapper}>
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={isUpdating}
            >
              Update
            </Button>
            {isUpdating && <CircularProgress size={30} className={classes.spinner} />}
          </div>
        </ValidatorForm>
      </div>
    );
  }
}

Settings.propTypes = {
  classes: PropTypes.object.isRequired,
  clearRuns: PropTypes.func.isRequired,
  notifyError: PropTypes.func.isRequired,
  notifyInfo: PropTypes.func.isRequired,
  notifySuccess: PropTypes.func.isRequired,
  updatePassword: PropTypes.func.isRequired,
};

Settings.contextTypes = {
  router: PropTypes.object.isRequired,
};

const ComponentWithData = compose(
  graphql(
    UPDATE_PASSWORD_MUTATION,
    updatePasswordProps('updatePassword')
  ),
  withApollo
)(Settings);

const connectedComponent = connect(null, {
  clearRuns,
  notifySuccess,
  notifyInfo,
  notifyError,
})(ComponentWithData);

export default withStyles(styles)(connectedComponent);
