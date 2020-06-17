import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import CheckIcon from '@material-ui/icons/Check';
import { withStyles } from '@material-ui/core/styles';
import { notifyInfo } from '../../state/ducks/notifyAndLog';
import { clearRuns } from '../../state/ducks/runs';

const REMOTE_URL = 'remoteUrl';

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

    const savedRemoteUrl = localStorage.getItem(REMOTE_URL) || '';

    this.state = {
      remoteUrl: savedRemoteUrl,
      editingUrl: savedRemoteUrl,
      saved: false,
    };
  }

  clearData = (e) => {
    const { clearRuns, notifyInfo } = this.props;
    e.preventDefault();

    clearRuns();
    notifyInfo('Local data cleared');
  }

  handleUrlChange = (e) => {
    this.setState({ editingUrl: e.target.value, saved: false });
  }

  handleSave = () => {
    const { editingUrl } = this.state;

    localStorage.setItem(REMOTE_URL, editingUrl);
    this.setState({ remoteUrl: editingUrl, saved: true });
  }

  handleReset = () => {
    const { remoteUrl } = this.state;

    this.setState({ editingUrl: remoteUrl, saved: false });
  }

  render() {
    const { classes } = this.props;
    const { remoteUrl, editingUrl, saved } = this.state;

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
          Save remote url for local pipeline
        </Typography>
        <div>
          <TextField
            id="remoteUrl"
            label="Remote Url"
            value={editingUrl}
            className={classes.textField}
            fullWidth
            onChange={this.handleUrlChange}
          />
          <div className={classes.buttons}>
            <Button
              variant="contained"
              color="secondary"
              disabled={remoteUrl === editingUrl}
              className={classNames(classes.button, classes.rightMargin)}
              onClick={this.handleReset}
            >
              Restore
            </Button>
            <Button
              variant="contained"
              disabled={remoteUrl === editingUrl || !editingUrl}
              className={classes.button}
              onClick={this.handleSave}
            >
              Save
            </Button>
            {saved && <CheckIcon className={classes.checkIcon} color="primary" />}
          </div>
        </div>
      </div>
    );
  }
}

Settings.propTypes = {
  classes: PropTypes.object.isRequired,
  clearRuns: PropTypes.func.isRequired,
  notifyInfo: PropTypes.func.isRequired,
};

Settings.contextTypes = {
  router: PropTypes.object.isRequired,
};

const connectedComponent = connect(null, {
  clearRuns,
  notifyInfo,
})(Settings);

export default withStyles(styles)(connectedComponent);
