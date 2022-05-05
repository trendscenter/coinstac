import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import TextField from '@material-ui/core/TextField';
import CheckIcon from '@material-ui/icons/Check';
import Switch from '@material-ui/core/Switch';
import { connect } from 'react-redux';
import { graphql, withApollo } from '@apollo/react-hoc';
import { flowRight as compose, get } from 'lodash';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import { ValidatorForm, TextValidator } from 'react-material-ui-form-validator';
import { updatePasswordProps } from '../../state/graphql/props';
import { UPDATE_PASSWORD_MUTATION } from '../../state/graphql/functions';
import { setClientCoreUrlAsync, setNetworkVolume, toggleTutorial } from '../../state/ducks/auth';
import { notifySuccess, notifyInfo, notifyError } from '../../state/ducks/notifyAndLog';
import { clearRuns } from '../../state/ducks/runs';
import UserEditController from './user-edit-controller';

const styles = theme => ({
  pageTitle: {
    marginBottom: theme.spacing(2),
  },
  pageSubtitle: {
    marginBottom: theme.spacing(1),
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
  },
  removeDataTitle: {
    marginBottom: theme.spacing(1),
  },
  updatePasswordTitle: {
    marginTop: theme.spacing(5),
    marginBottom: theme.spacing(1),
  },
  sectionTitle: {
    marginBottom: theme.spacing(1),
  },
  topMargin: {
    marginTop: theme.spacing(4),
  },
  rightMargin: {
    marginRight: theme.spacing(2),
  },
  textField: {
    marginTop: theme.spacing(2),
  },
  directory: {
    display: 'flex',
    alignItems: 'flex-end',
  },
  button: {
    marginTop: theme.spacing(1),
  },
  buttons: {
    display: 'flex',
    alignItems: 'center',
  },
  checkIcon: {
    marginTop: theme.spacing(1),
    marginLeft: theme.spacing(1),
  },
  formControl: {
    marginBottom: theme.spacing(1),
    display: 'block',
  },
  spinner: {
    color: theme.palette.grey[500],
    marginLeft: theme.spacing(2),
  },
  buttonWrapper: {
    display: 'flex',
    alignItems: 'center',
    marginTop: theme.spacing(2),
  },
  warning: {
    color: 'red',
  },
});

class Settings extends Component {
  constructor(props) {
    super(props);

    this.state = {
      editingURL: props.clientServerURL,
      savingURLStatus: 'init',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      isUpdating: false,
    };
  }

  // eslint-disable-next-line
  UNSAFE_componentWillReceiveProps(nextProps) {
    const { clientServerURL } = this.props;

    if (clientServerURL !== nextProps.clientServerURL) {
      this.setState({ editingURL: nextProps.clientServerURL });
    }
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

  handleURLChange = (e) => {
    this.setState({ editingURL: e.target.value, savingURLStatus: 'init' });
  }

  handleSave = () => {
    const { setClientCoreUrlAsync } = this.props;
    const { editingURL } = this.state;

    this.setState({ savingURLStatus: 'pending' });

    setClientCoreUrlAsync(editingURL)
      .then(() => {
        this.setState({ savingURLStatus: 'success' });
      })
      .catch(() => {
        this.setState({ savingURLStatus: 'fail' });
      });
  }

  handleReset = () => {
    const { clientServerURL } = this.props;

    this.setState({ editingURL: clientServerURL, savingURLStatus: 'init' });
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
        this.setState({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
          isUpdating: false,
        });
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

  handleNetworkVolumeChange = (event) => {
    const { setNetworkVolume } = this.props;
    setNetworkVolume(event.target.checked);
  }

  render() {
    const {
      classes,
      clientServerURL,
      networkVolume,
      isTutorialHidden,
      toggleTutorial,
    } = this.props;
    const {
      currentPassword,
      newPassword,
      confirmPassword,
      isUpdating,
      editingURL,
      savingURLStatus,
    } = this.state;

    return (
      <div className="settings">
        <div className="page-header">
          <Typography variant="h4" className={classes.pageTitle}>
            Settings
          </Typography>
        </div>
        <UserEditController />
        <hr />

        <Typography variant="h5" className={classes.removeDataTitle}>
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

        <Typography variant="h5" className={classes.topMargin}>
          Save client server URL for local pipeline
        </Typography>
        <div className={classes.directory}>
          <TextField
            id="clientServerURL"
            label="Client Server URL"
            value={editingURL}
            className={classes.textField}
            onChange={this.handleURLChange}
          />
        </div>
        <div className={classes.buttons}>
          <Button
            variant="contained"
            color="secondary"
            disabled={clientServerURL === editingURL}
            className={classNames(classes.button, classes.rightMargin)}
            onClick={this.handleReset}
          >
            Restore
          </Button>
          <Button
            variant="contained"
            disabled={clientServerURL === editingURL}
            className={classes.button}
            onClick={this.handleSave}
          >
            Save
          </Button>
          {savingURLStatus === 'success' && <CheckIcon className={classes.checkIcon} color="primary" />}
        </div>

        <Typography variant="h5" className={classes.topMargin}>
          Enable network volume mounting for computations
        </Typography>
        <div className={classes.directory}>
          <Switch
            checked={networkVolume}
            value={networkVolume}
            onChange={this.handleNetworkVolumeChange}
          />
        </div>
        <div>
          {networkVolume
            && (
            <Typography variant="subtitle1" className={classes.warning}>
              To use network volumes on Windows users must run the COINSTAC application with
              administrator priviledges or have Windows Developer Mode enabled
            </Typography>
            )
          }

        </div>

        <Typography variant="h5" className={classes.topMargin}>
          Hide tutorial for running pipeline
        </Typography>
        <div className={classes.directory}>
          <Switch
            checked={isTutorialHidden}
            value={isTutorialHidden}
            onChange={toggleTutorial}
          />
        </div>

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
  clientServerURL: PropTypes.string.isRequired,
  networkVolume: PropTypes.bool.isRequired,
  isTutorialHidden: PropTypes.bool.isRequired,
  classes: PropTypes.object.isRequired,
  setClientCoreUrlAsync: PropTypes.func.isRequired,
  clearRuns: PropTypes.func.isRequired,
  notifyError: PropTypes.func.isRequired,
  notifyInfo: PropTypes.func.isRequired,
  notifySuccess: PropTypes.func.isRequired,
  updatePassword: PropTypes.func.isRequired,
  setNetworkVolume: PropTypes.func.isRequired,
  toggleTutorial: PropTypes.func.isRequired,
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

const mapStateToProps = ({ auth }) => ({
  clientServerURL: auth.clientServerURL,
  networkVolume: auth.networkVolume,
  isTutorialHidden: auth.isTutorialHidden,
});

const connectedComponent = connect(mapStateToProps, {
  setClientCoreUrlAsync,
  setNetworkVolume,
  toggleTutorial,
  clearRuns,
  notifySuccess,
  notifyInfo,
  notifyError,
})(ComponentWithData);

export default withStyles(styles)(connectedComponent);
