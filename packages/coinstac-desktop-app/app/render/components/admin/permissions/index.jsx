import { graphql, withApollo } from '@apollo/react-hoc';
import Checkbox from '@material-ui/core/Checkbox';
import CircularProgress from '@material-ui/core/CircularProgress';
import makeStyles from '@material-ui/core/styles/makeStyles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import { flowRight as compose, get } from 'lodash';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { logout } from '../../../state/ducks/auth';
import { notifyError } from '../../../state/ducks/notifyAndLog';
import {
  ADD_USER_ROLE_MUTATION,
  FETCH_ALL_USERS_QUERY,
  REMOVE_USER_ROLE_MUTATION,
  USER_CHANGED_SUBSCRIPTION,
} from '../../../state/graphql/functions';
import {
  getAllAndSubProp,
  userRolesProp,
} from '../../../state/graphql/props';
import { getGraphQLErrorMessage } from '../../../utils/helpers';
import MemberAvatar from '../../common/member-avatar';

const useStyles = makeStyles(() => ({
  avatarWrapper: {
    display: 'flex',
    alignItems: 'center',
  },
  checkbox: {
    padding: 0,
  },
}));

function Permission({
  users,
  addUserRole,
  removeUserRole,
  subscribeToUsers,
}, { router }) {
  const currentUser = useSelector(state => state.auth.user);
  const dispatch = useDispatch();

  const [isUpdating, setIsUpdating] = useState();
  const [userId, setUserId] = useState(null);
  const [role, setRole] = useState(null);

  const classes = useStyles();

  useEffect(() => {
    let unsubscribeUsers;

    if (!get(currentUser, 'permissions.roles.admin')) {
      router.push('/');
    } else {
      unsubscribeUsers = subscribeToUsers(null);
    }

    return () => {
      if (unsubscribeUsers) {
        unsubscribeUsers();
      }
    };
  }, []);

  const logoutUser = () => {
    dispatch(logout())
      .then(() => {
        router.push('/login');
      });
  };

  const toggleUserAppRole = (userId, checked, role) => {
    const mutation = checked ? addUserRole : removeUserRole;

    setIsUpdating(true);
    setUserId(userId);
    setRole(role);

    mutation(userId, 'app', role, role, 'app')
      .then(() => {
        if (currentUser.id === userId && role === 'admin') {
          logoutUser();
        }
      })
      .catch((error) => {
        dispatch(notifyError(getGraphQLErrorMessage(error)));
      })
      .finally(() => {
        setIsUpdating(false);
      });
  };

  return (
    <>
      <Table id="permission-table">
        <TableHead>
          <TableRow>
            <TableCell>Username</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Admin</TableCell>
            <TableCell>Author</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users && users.map((user) => {
            const isAdmin = get(user, 'permissions.roles.admin', false);
            const isAuthor = get(user, 'permissions.roles.author', false);

            const isUpdatingAdmin = userId === user.id && role === 'admin';
            const isUpdatingAuthor = userId === user.id && role === 'author';

            return (
              <TableRow key={`${user.id}-row`}>
                <TableCell>
                  <div className={classes.avatarWrapper}>
                    <MemberAvatar
                      id={user.id}
                      name={user.username}
                      width={30}
                    />
                    <span>{user.username}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {user.email}
                </TableCell>
                <TableCell>
                  {(isUpdating && isUpdatingAdmin) ? (
                    <CircularProgress size={20} />
                  ) : (
                    <Checkbox
                      className={classes.checkbox}
                      checked={isAdmin}
                      disabled={user.id === currentUser.id}
                      name="Admin"
                      onChange={() => toggleUserAppRole(user.id, !isAdmin, 'admin')}
                    />
                  )}
                </TableCell>
                <TableCell>
                  {(isUpdating && isUpdatingAuthor) ? (
                    <CircularProgress />
                  ) : (
                    <Checkbox
                      className={classes.checkbox}
                      checked={isAuthor}
                      disabled={user.id === currentUser.id}
                      name="Author"
                      onChange={() => toggleUserAppRole(user.id, !isAuthor, 'author')}
                    />
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
}

Permission.contextTypes = {
  router: PropTypes.object.isRequired,
};

Permission.propTypes = {
  users: PropTypes.array,
  addUserRole: PropTypes.func.isRequired,
  removeUserRole: PropTypes.func.isRequired,
  subscribeToUsers: PropTypes.func.isRequired,
};

Permission.defaultProps = {
  users: [],
};

const PermissionWithData = compose(
  graphql(FETCH_ALL_USERS_QUERY, getAllAndSubProp(
    USER_CHANGED_SUBSCRIPTION,
    'users',
    'fetchAllUsers',
    'subscribeToUsers',
    'userChanged',
  )),
  graphql(ADD_USER_ROLE_MUTATION, userRolesProp('addUserRole')),
  graphql(REMOVE_USER_ROLE_MUTATION, userRolesProp('removeUserRole')),
  withApollo,
)(Permission);

export default PermissionWithData;
