import React from 'react';
import Avatar from 'react-avatar';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  containerStyles: {
    display: 'inline-block',
    margin: theme.spacing.unit,
    verticalAlign: 'top',
    textAlign: 'center',
  },
  textStyles: {
    marginBottom: 0,
    textAlign: 'center',
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
        && <p className={classes.textStyles}>{consRole}</p>
      }
      {showDetails && <p className={classes.textStyles}><em>{name}</em></p>}
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
