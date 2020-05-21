import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import { notifyInfo } from '../../state/ducks/notifyAndLog';
import { clearRuns } from '../../state/ducks/runs';

const styles = theme => ({
  pageTitle: {
    marginBottom: theme.spacing(2),
  },
  pageSubtitle: {
    marginBottom: theme.spacing(1),
  },
  sectionTitle: {
    marginBottom: theme.spacing(1),
  },
  button: {
    marginTop: theme.spacing(1),
  },
});

class Settings extends Component {
  clearData = (e) => {
    const { clearRuns, notifyInfo } = this.props;
    e.preventDefault();

    clearRuns();
    notifyInfo('Local data cleared');
  }

  render() {
    const { classes } = this.props;

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
