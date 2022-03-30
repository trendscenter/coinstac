import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { graphql, withApollo } from '@apollo/react-hoc';
import { flowRight as compose, get } from 'lodash';
import Checkbox from '@material-ui/core/Checkbox';
import CircularProgress from '@material-ui/core/CircularProgress';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import { IconButton } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import { useMutation } from '@apollo/client';
import MemberAvatar from '../common/member-avatar';
import { logout } from '../../state/ducks/auth';
import { notifyError } from '../../state/ducks/notifyAndLog';
import {
  getAllAndSubProp,
  userRolesProp,
} from '../../state/graphql/props';
import {
  FETCH_ALL_USERS_QUERY,
  USER_CHANGED_SUBSCRIPTION,
  ADD_USER_ROLE_MUTATION,
  REMOVE_USER_ROLE_MUTATION,
  DELETE_USER_MUTATION,
} from '../../state/graphql/functions';
import { getGraphQLErrorMessage } from '../../utils/helpers';
import ListDeleteModal from '../common/list-delete-modal';


const styles = () => ({
  avatarWrapper: {
    display: 'flex',
    alignItems: 'center',
  },
  checkbox: {
    padding: 0,
  },
});

function Permission(props, context) {
  const {
    currentUser,
    users,
    classes,
    notifyError,
    subscribeToUsers,
  } = props;
  const [isUpdating, setIsUpdating] = useState();
  const [userId, setUserId] = useState(null);
  const [role, setRole] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [deleteUser] = useMutation(DELETE_USER_MUTATION);

  useEffect(() => {
    const { router } = context;
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
    const { logout } = props;
    const { router } = context;

    logout()
      .then(() => {
        router.push('/login');
      });
  };

  const toggleUserAppRole = (userId, checked, role) => {
    const {
      currentUser, addUserRole, removeUserRole, notifyError,
    } = props;
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
        notifyError(getGraphQLErrorMessage(error));
      })
      .finally(() => {
        setIsUpdating(false);
      });
  };

  const handleDeleteUser = () => {
    deleteUser({
      variables: { userId: userToDelete.id },
    }).then(() => {
      setShowModal(false);
    }).catch((e) => {
      notifyError(e.message);
    });
  };

  return (
    <div>
      <div className="page-header">
        <Typography variant="h4">
          App Roles
        </Typography>
      </div>
      <div>
        <Table id="permission-table">
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Admin</TableCell>
              <TableCell>Author</TableCell>
              <TableCell>Delete</TableCell>
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
                  <TableCell>
                    <IconButton onClick={() => { setShowModal(true); setUserToDelete(user); }}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <ListDeleteModal
          close={() => { setShowModal(false); }}
          deleteItem={handleDeleteUser}
          itemName={`user: "${(userToDelete && userToDelete.username)}"`}
          show={showModal}
        />
      </div>
    </div>
  );
}

Permission.contextTypes = {
  router: PropTypes.object.isRequired,
};

Permission.propTypes = {
  currentUser: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
  users: PropTypes.array,
  addUserRole: PropTypes.func.isRequired,
  removeUserRole: PropTypes.func.isRequired,
  logout: PropTypes.func.isRequired,
  notifyError: PropTypes.func.isRequired,
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
    'userChanged'
  )),
  graphql(ADD_USER_ROLE_MUTATION, userRolesProp('addUserRole')),
  graphql(REMOVE_USER_ROLE_MUTATION, userRolesProp('removeUserRole')),
  withApollo
)(Permission);

const mapStateToProps = ({ auth }) => ({
  currentUser: auth.user,
});

const connectedComponent = connect(mapStateToProps, {
  logout,
  notifyError,
})(PermissionWithData);

export default withStyles(styles, { withTheme: true })(connectedComponent);
