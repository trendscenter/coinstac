import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import cx from 'classnames';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import MessageIcon from '@material-ui/icons/Message';
import EditIcon from '@material-ui/icons/Edit';

import useStyles from './result-item.styles';
import MemberAvatar from '../../common/member-avatar';

function ResultItem({
  id, description, covariates, tags, className, owner, auth,
}) {
  const classes = useStyles();

  return (
    <Paper elevation={3} className={cx(classes.root, className)}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
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
        </Box>
        <Box display="flex" flexDirection="column" justifyContent="center">
          <MemberAvatar
            id={owner.id}
            name={owner.username}
            width={30}
            className={classes.avatar}
            showDetails
          />
          {auth.user.id === owner.id ? (
            <Button
              variant="contained"
              color="default"
              endIcon={<EditIcon />}
              component={Link}
              to={`/dashboard/data-discovery/${id}`}
            >
              Edit data
            </Button>
          ) : (
            <Button
              variant="contained"
              color="secondary"
              endIcon={<MessageIcon />}
              component={Link}
              to={encodeURI(`/dashboard/threads?new=true&title=Question about your dataset&recipientId=${owner.id}&recipientUsername=${owner.username}`)}
            >
              Message User
            </Button>
          )}
        </Box>
      </Box>
    </Paper>
  );
}

ResultItem.defaultProps = {
  covariates: [],
  tags: [],
  className: null,
  owner: null,
};

ResultItem.propTypes = {
  id: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  covariates: PropTypes.array,
  tags: PropTypes.array,
  className: PropTypes.string,
  owner: PropTypes.object,
  auth: PropTypes.object.isRequired,
};

const mapStateToProps = ({ auth }) => ({
  auth,
});

export default connect(mapStateToProps)(ResultItem);
