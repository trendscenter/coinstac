import React from 'react';
import Typography from '@material-ui/core/Typography';
import makeStyles from '@material-ui/core/styles/makeStyles';

const useStyles = makeStyles(theme => ({
  description: {
    margin: theme.spacing(1, 0),
  },
}));

function PipelineStepInputDirectory() {
  const classes = useStyles();

  return (
    <div style={{ paddingLeft: 10 }}>
      <Typography variant="body2" className={classes.description}>
        Path to a system directory
      </Typography>
    </div>
  );
}

export default PipelineStepInputDirectory;
