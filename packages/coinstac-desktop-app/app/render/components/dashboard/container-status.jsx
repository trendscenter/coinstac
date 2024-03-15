/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import makeStyles from '@material-ui/core/styles/makeStyles';
import Tooltip from '@material-ui/core/Tooltip';
import classNames from 'classnames';
import capitalize from 'lodash/capitalize';
import PropTypes from 'prop-types';
import React from 'react';

import DockerImage from '../../../../img/icons/docker.svg';
import SingularityImage from '../../../../img/icons/singularity.svg';

const useStyles = makeStyles(theme => ({
  status: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },
  buttonWrapper: {
    display: 'flex',
    border: '1px solid #ccc',
    borderRadius: 4,
    cursor: 'pointer',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
    '&:first-of-type': {
      borderRight: '1px solid #ccc',
    },
    '& > img': {
      opacity: 0.1,
    },
  },
  buttonActive: {
    '& > img': {
      opacity: 1,
    },
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: theme.spacing(1),
  },
  statusUp: {
    width: 20,
    height: 20,
    background: '#5cb85c',
    borderRadius: '50%',
    marginLeft: '0.5rem',
    cursor: 'pointer',
  },
  statusDown: {
    width: 20,
    height: 20,
    background: '#d9534f',
    borderRadius: '50%',
    marginLeft: '0.5rem',
    cursor: 'pointer',
  },
}));

function ContainerStatus({
  status,
  containerService,
  onChangeContainerService,
}) {
  const classes = useStyles();

  return (
    <div className={classes.status}>
      <div
        className={classes.buttonWrapper}
        onClick={onChangeContainerService}
      >
        <span
          className={classNames(
            classes.button,
            containerService === 'docker' && classes.buttonActive,
          )}
        >
          <img src={DockerImage} alt="docker" className={classes.icon} />
          Docker
        </span>
        <span
          className={classNames(
            classes.button,
            containerService === 'singularity' && classes.buttonActive,
          )}
        >
          <img src={SingularityImage} alt="singularity" className={classes.icon} />
          Singularity
        </span>
      </div>
      <Tooltip title={`${capitalize(containerService)} is ${status ? 'on' : 'off'}`}>
        <span className={status ? classes.statusUp : classes.statusDown} />
      </Tooltip>
    </div>
  );
}

ContainerStatus.defaultProps = {
  status: false,
};

ContainerStatus.propTypes = {
  status: PropTypes.bool,
  containerService: PropTypes.string.isRequired,
  onChangeContainerService: PropTypes.func.isRequired,
};

export default ContainerStatus;
