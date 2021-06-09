import React from 'react';
import PropTypes from 'prop-types';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';

import useDockerStatus from './effects/useDockerStatus';

const styles = () => ({
  status: {
    display: 'flex',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
  },
  statusUp: {
    width: 20,
    height: 20,
    background: '#5cb85c',
    borderRadius: '50%',
    marginLeft: '0.5rem',
  },
  statusDown: {
    width: 20,
    height: 20,
    background: '#d9534f',
    borderRadius: '50%',
    marginLeft: '0.5rem',
  },
});

function DockerStatusChecker({ classes }) {
  const dockerStatus = useDockerStatus();

  return (
    <span className={classes.status}>
      <Typography variant="subtitle2" className={classes.statusText}>
        Docker Status:
      </Typography>
      <span className={dockerStatus ? classes.statusUp : classes.statusDown} />
    </span>
  );
}

DockerStatusChecker.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(DockerStatusChecker);
