import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import Typography from '@material-ui/core/Typography';
import makeStyles from '@material-ui/core/styles/makeStyles';

const useStyles = makeStyles(theme => ({
  description: {
    margin: theme.spacing(1, 0),
  },
}));

function PipelineStepInputDirectory({
  objKey, updateStep, getNewObj, step,
}) {
  const classes = useStyles();

  useEffect(() => {
    updateStep({
      ...step,
      inputMap: getNewObj(objKey, {}),
    });
  }, []);

  return (
    <div style={{ paddingLeft: 10 }}>
      <Typography variant="body2" className={classes.description}>
        Path to a system directory
      </Typography>
    </div>
  );
}

PipelineStepInputDirectory.propTypes = {
  objKey: PropTypes.string.isRequired,
  step: PropTypes.object.isRequired,
  getNewObj: PropTypes.func.isRequired,
  updateStep: PropTypes.func.isRequired,
};

export default PipelineStepInputDirectory;
