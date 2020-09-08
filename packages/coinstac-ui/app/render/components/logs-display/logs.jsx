import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Icon from '@material-ui/core/Icon';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  pageTitle: {
    marginBottom: theme.spacing(2),
  },
  logsContainer: {
    padding: theme.spacing(2),
    overflowY: 'auto',
    height: '100%',
    scrollBehavior: 'smooth',
  },
  message: {
    display: 'block',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
  },
});

class Logs extends Component {
  getContainer = () => {
    return document.getElementById('logs-container');
  }

  handleScrollToTop = () => {
    this.getContainer().scrollTop = 0;
  }

  handleScrollToBottom = () => {
    const logsContainer = this.getContainer();
    logsContainer.scrollTop = logsContainer.scrollHeight;
  }

  render() {
    const { classes, logs } = this.props;

    return (
      <div className="settings">
        <div className="page-header">
          <Typography variant="h4" className={classes.pageTitle}>
            Logs
          </Typography>
        </div>
        {logs && (
          <div className="logs-wrapper">
            <button
              type="button"
              className="scroll-to-bottom"
              onClick={this.handleScrollToBottom}
            >
              <Icon className="fa fa-arrow-down arrow-icon" />
            </button>
            <div id="logs-container" className={classes.logsContainer} onScroll={this.handleScroll}>
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
              className="scroll-to-top"
              onClick={this.handleScrollToTop}
            >
              <Icon className="fa fa-arrow-up arrow-icon" />
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
