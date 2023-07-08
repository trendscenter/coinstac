import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import { clipboard } from 'electron';

const styles = theme => ({
  pageTitle: {
    marginBottom: theme.spacing(2),
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: theme.spacing(2),
  },
  logsWrapper: {
    padding: theme.spacing(2),
    overflowY: 'auto',
    height: '100%',
    scrollBehavior: 'smooth',
  },
  message: {
    display: 'block',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    marginBottom: theme.spacing(1),
    '&:last-of-type': {
      marginBottom: 0,
    },
  },
});

class Logs extends Component {
  getWrapper = () => {
    return document.getElementById('logs-wrapper');
  }

  handleScrollToTop = () => {
    this.getWrapper().scrollTop = 0;
  }

  handleScrollToBottom = () => {
    const logsWrapper = this.getWrapper();
    logsWrapper.scrollTop = logsWrapper.scrollHeight;
  }

  handleCopyLogs = () => {
    const { logs } = this.props;
    clipboard.writeText(logs.join('\n'));
  }

  handleCopyDockerLogs = () => { }

  render() {
    const { classes, logs } = this.props;

    return (
      <div className="settings">
        <div className="page-header">
          <Typography variant="h4" className={classes.pageTitle}>
            Logs
          </Typography>
        </div>
        <div className={classes.actions}>
          <Button variant="contained" onClick={this.handleCopyLogs}>
            Copy Logs
          </Button>
          <Button variant="contained" onClick={this.handleCopyDockerLogs}>
            Copy Docker Logs
          </Button>
        </div>
        {logs && (
          <div className="logs-wrapper">
            <button
              type="button"
              className="scroll-to-top"
              onClick={this.handleScrollToTop}
            >
              <ArrowUpwardIcon className="arrow-icon" />
            </button>
            <div id="logs-wrapper" className={classes.logsWrapper}>
              {logs.map((message, ind) => (
                <span
                  className={classes.message}
                  key={ind} // eslint-disable-line react/no-array-index-key
                >
                  {message}
                </span>
              ))}
            </div>
            <button
              type="button"
              className="scroll-to-bottom"
              onClick={this.handleScrollToBottom}
            >
              <ArrowDownwardIcon className="arrow-icon" />
            </button>
          </div>
        )}
      </div>
    );
  }
}

Logs.propTypes = {
  classes: PropTypes.object.isRequired,
  logs: PropTypes.array,
};

Logs.defaultProps = {
  logs: [],
};

const mapStateToProps = ({ app }) => ({
  logs: app.logs,
});

const connectedComponent = connect(mapStateToProps)(Logs);

export default withStyles(styles)(connectedComponent);
