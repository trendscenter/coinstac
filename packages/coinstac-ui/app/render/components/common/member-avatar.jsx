import React from 'react';
import Avatar from 'react-avatar';
import PropTypes from 'prop-types';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  containerStyles: {
    display: 'inline-block',
    margin: theme.spacing.unit,
    verticalAlign: 'top',
    textAlign: 'center',
  },
  textStyles: {
    fontSize: 12,
  },
});

function MemberAvatar({
  name,
  consRole,
  showDetails,
  width,
  classes,
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
    </div>
  );
}

MemberAvatar.propTypes = {
  name: PropTypes.string.isRequired,
  consRole: PropTypes.string,
  showDetails: PropTypes.bool,
  width: PropTypes.number.isRequired,
  classes: PropTypes.object.isRequired,
};

MemberAvatar.defaultProps = {
  consRole: null,
  showDetails: false,
};

export default withStyles(styles)(MemberAvatar);
