import React from 'react';
import capitalize from 'lodash/capitalize';
import PropTypes from 'prop-types';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';

const styles = () => ({
  status: {
    display: 'flex',
    alignItems: 'center',
    borderWidth: 0,
    cursor: 'pointer',
  },
  statusText: {
    fontSize: 16,
    textDecoration: 'underline',
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

function ContainerStatus({
  classes,
  status,
  containerService,
  onChangeContainerService,
}) {
  return (
    <button
      className={classes.status}
      type="button"
      onClick={onChangeContainerService}
    >
      <Typography variant="subtitle2" className={classes.statusText}>
        {`${capitalize(containerService)} Status:`}
      </Typography>
      <span className={status ? classes.statusUp : classes.statusDown} />
    </button>
  );
}

ContainerStatus.defaultProps = {
  status: false,
};

ContainerStatus.propTypes = {
  status: PropTypes.bool,
  classes: PropTypes.object.isRequired,
  containerService: PropTypes.string.isRequired,
  onChangeContainerService: PropTypes.func.isRequired,
};

export default withStyles(styles)(ContainerStatus);
