import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import CheckIcon from '@material-ui/icons/Check';
import { withStyles } from '@material-ui/core/styles';
import { setClientCoreUrlAsync } from '../../state/ducks/auth';
import { notifyInfo } from '../../state/ducks/notifyAndLog';
import { clearRuns } from '../../state/ducks/runs';

const styles = theme => ({
  pageTitle: {
    marginBottom: theme.spacing(2),
  },
  pageSubtitle: {
    marginBottom: theme.spacing(1),
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
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
});

class Settings extends Component {
  constructor(props) {
    super(props);

    this.state = {
      editingURL: props.clientServerURL,
      savingURLStatus: 'init',
    };
  }

  // eslint-disable-next-line
  UNSAFE_componentWillReceiveProps(nextProps) {
    const { clientServerURL } = this.props;

    if (clientServerURL !== nextProps.clientServerURL) {
      this.setState({ editingURL: nextProps.clientServerURL });
    }
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

  render() {
    const { classes, clientServerURL } = this.props;
    const { editingURL, savingURLStatus } = this.state;

    return (
      <div className="settings">
        <div className="page-header">
          <Typography variant="h4" className={classes.pageTitle}>
            Settings
          </Typography>
        </div>

        <Typography variant="h5" className={classes.pageSubtitle}>
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

        <Typography variant="h5" className={classNames(classes.pageSubtitle, classes.topMargin)}>
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
            disabled={clientServerURL === editingURL || !editingURL}
            className={classes.button}
            onClick={this.handleSave}
          >
            Save
          </Button>
          {savingURLStatus === 'success' && <CheckIcon className={classes.checkIcon} color="primary" />}
        </div>
      </div>
    );
  }
}

Settings.propTypes = {
  clientServerURL: PropTypes.string.isRequired,
  classes: PropTypes.object.isRequired,
  setClientCoreUrlAsync: PropTypes.func.isRequired,
  clearRuns: PropTypes.func.isRequired,
  notifyInfo: PropTypes.func.isRequired,
};

Settings.contextTypes = {
  router: PropTypes.object.isRequired,
};

const mapStateToProps = ({ auth }) => ({
  clientServerURL: auth.clientServerURL,
});

const connectedComponent = connect(mapStateToProps, {
  setClientCoreUrlAsync,
  clearRuns,
  notifyInfo,
})(Settings);

export default withStyles(styles)(connectedComponent);
