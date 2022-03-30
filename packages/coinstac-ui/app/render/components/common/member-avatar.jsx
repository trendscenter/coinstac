import React from 'react';
import { useQuery } from '@apollo/client';
import { get } from 'lodash';
import Avatar from 'react-avatar';
import PropTypes from 'prop-types';
import cx from 'classnames';
import Typography from '@material-ui/core/Typography';
import DoneIcon from '@material-ui/icons/Done';
import { withStyles } from '@material-ui/core/styles';

import {
  FETCH_USER_QUERY,
} from '../../state/graphql/functions';

const styles = theme => ({
  avatarWrapper: {
    display: 'inline-block',
    margin: theme.spacing(1),
    marginLeft: 0,
    verticalAlign: 'top',
    textAlign: 'center',
    position: 'relative',
  },
  text: {
    fontSize: 12,
    display: 'block',
  },
  mark: {
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
  className,
  ready,
}) {
  const { data } = useQuery(FETCH_USER_QUERY, {
    variables: { userId: id },
    onError: (error) => { console.error({ error }); },
  });

  const user = get(data, 'fetchUser');

  return (
    <div key={`${name}-avatar`} className={cx(classes.avatarWrapper, className)}>
      {user && user.photo
        ? <Avatar name={name} size={width} src={user.photo} round />
        : <Avatar name={name} size={width} round />}
      {
        consRole && showDetails
        && <Typography variant="subtitle2" className={classes.text}>{consRole}</Typography>
      }
      {
        showDetails
        && <Typography variant="caption" className={classes.text}>{name}</Typography>
      }
      {
        ready
        && <DoneIcon className={classes.mark} />
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
  className: PropTypes.string,
};

MemberAvatar.defaultProps = {
  consRole: null,
  showDetails: false,
  ready: false,
  className: null,
};

export default withStyles(styles)(MemberAvatar);
