import React from 'react';
import Avatar from 'react-avatar';
import PropTypes from 'prop-types';
import Typography from '@material-ui/core/Typography';
import DoneIcon from '@material-ui/icons/Done';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  containerStyles: {
    display: 'inline-block',
    margin: theme.spacing(1),
    verticalAlign: 'top',
    textAlign: 'center',
    position: 'relative',
  },
  textStyles: {
    fontSize: 12,
  },
  markStyles: {
    fontSize: 14,
    color: 'white',
    backgroundColor: '#5cb85c',
    borderRadius: 14,
    position: 'absolute',
    right: -5,
    top: -5,
  },
});

function MemberAvatar({
  name,
  consRole,
  showDetails,
  width,
  classes,
  ready,
}) {
  return (
    <div key={`${name}-avatar`} className={classes.containerStyles}>
      <Avatar name={name} size={width} />
      {
        consRole && showDetails
        && <Typography variant="subtitle2" className={classes.textStyles}>{consRole}</Typography>
      }
      {
        showDetails
        && <Typography variant="caption" className={classes.textStyles}>{name}</Typography>
      }
      {
        ready
        && <DoneIcon className={classes.markStyles} />
      }
    </div>
  );
}

MemberAvatar.propTypes = {
  classes: PropTypes.object.isRequired,
  consRole: PropTypes.string,
  ready: PropTypes.bool,
  name: PropTypes.string.isRequired,
  showDetails: PropTypes.bool,
  width: PropTypes.number.isRequired,
};

MemberAvatar.defaultProps = {
  consRole: null,
  showDetails: false,
  ready: false,
};

export default withStyles(styles)(MemberAvatar);
