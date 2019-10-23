import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  pageTitle: {
    marginBottom: theme.spacing.unit * 2,
  },
  logsContainer: {
    padding: theme.spacing.unit * 2,
    border: '1px inset #ccc',
    backgroundColor: '#ccc',
  },
  logText: {
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
  },
});

function Logs(props) {
  const { classes, logs } = props;

  return (
    <div className="settings">
      <div className="page-header">
        <Typography variant="h4" className={classes.pageTitle}>
          Logs
        </Typography>
      </div>
      {
        logs && (
          <div className={classes.logsContainer}>
            <pre className={classes.logText}>{ logs }</pre>
          </div>
        )
      }
    </div>
  );
}

Logs.propTypes = {
  logs: PropTypes.string,
  classes: PropTypes.object.isRequired,
};

Logs.defaultProps = {
  logs: null,
};

function mapStateToProps({ app }) {
  return {
    logs: app.logs,
  };
}

const connectedComponent = connect(mapStateToProps)(Logs);

export default withStyles(styles)(connectedComponent);
