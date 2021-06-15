import React from 'react';
import { useQuery } from '@apollo/client';
import { get } from 'lodash';
import Avatar from 'react-avatar';
import PropTypes from 'prop-types';
import Typography from '@material-ui/core/Typography';
import DoneIcon from '@material-ui/icons/Done';
import { withStyles } from '@material-ui/core/styles';
import {
  FETCH_USER_QUERY,
} from '../../state/graphql/functions';

const styles = theme => ({
  containerStyles: {
    display: 'inline-block',
    margin: theme.spacing(1),
    marginLeft: 0,
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
  id,
  name,
  consRole,
  showDetails,
  width,
  classes,
  ready,
}) {
  const { data } = useQuery(FETCH_USER_QUERY, {
    variables: { userId: id },
  });

  const user = get(data, 'fetchUser');

  return (
    <div key={`${name}-avatar`} className={classes.containerStyles}>
      {user && user.photo
        ? <Avatar name={name} size={width} src={user.photo} round />
        : <Avatar name={name} size={width} round />}
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
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  classes: PropTypes.object.isRequired,
  consRole: PropTypes.string,
  ready: PropTypes.bool,
  showDetails: PropTypes.bool,
  width: PropTypes.number.isRequired,
};

MemberAvatar.defaultProps = {
  consRole: null,
  showDetails: false,
  ready: false,
};

export default withStyles(styles)(MemberAvatar);
