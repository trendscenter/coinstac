import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import Box from '@material-ui/core/Box';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';

import useStyles from './result-item.styles';

function ResultItem({ description, covariates, tags, className }) {
  const classes = useStyles();

  return (
    <Paper elevation={3} className={cx(classes.root, className)}>
      <Box>
        <Typography variant="body2" className={classes.label}>Description:</Typography>
        <Typography variant="body2">{ description }</Typography>
      </Box>
      <Box>
        <Typography variant="body2" className={classes.label}>Covariates:</Typography>
        <Typography variant="body2">{ covariates.join(', ') }</Typography>
      </Box>
      <Box>
        <Typography variant="body2" className={classes.label}>Tags:</Typography>
        <Typography variant="body2">{ tags.join(', ') }</Typography>
      </Box>
    </Paper>
  );
}

ResultItem.defaultProps = {
  covariates: [],
  tags: [],
  className: null,
};

ResultItem.propTypes = {
  description: PropTypes.string.isRequired,
  covariates: PropTypes.array,
  tags: PropTypes.array,
  className: PropTypes.string,
};

export default ResultItem;
