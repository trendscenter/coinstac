import React from 'react';
import PropTypes from 'prop-types';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import RunsList from '../common/runs-list';

const styles = theme => ({
  pageTitle: {
    marginBottom: theme.spacing.unit * 2,
  },
});

const ResultsList = ({ runs, consortia, classes }) => {
  return (
    <div>
      <div className="page-header">
        <Typography variant="h4" className={classes.pageTitle}>
          Results
        </Typography>
      </div>

      <RunsList
        consortia={consortia}
        hoursSinceActive={0}
        limitToComplete
        runs={runs}
      />
    </div>
  );
};

ResultsList.propTypes = {
  runs: PropTypes.array,
  consortia: PropTypes.array,
  classes: PropTypes.object.isRequired,
};

ResultsList.defaultProps = {
  runs: null,
  consortia: null,
};

export default withStyles(styles)(ResultsList);
