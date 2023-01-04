/* eslint-disable react/no-array-index-key */
import React from 'react';
import PropTypes from 'prop-types';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  description: {
    margin: theme.spacing(1, 0),
  },
});

function PipelineStepInputDirectory(props) {
  const { classes } = props;

  return (
    <div style={{ paddingLeft: 10 }}>
      <Typography variant="body2" className={classes.description}>
        Path to a system directory
      </Typography>
    </div>
  );
}

PipelineStepInputDirectory.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(PipelineStepInputDirectory);
