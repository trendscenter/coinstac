import { graphql, withApollo } from '@apollo/react-hoc';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import { useMutation } from '@apollo/client';
import { flowRight as compose, get, omit } from 'lodash';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import MemberAvatar from '../../common/member-avatar';
import { notifySuccess, notifyError } from '../../../state/ducks/notifyAndLog';
import {
  FETCH_ALL_USERS_QUERY,
  USER_CHANGED_SUBSCRIPTION,
  ADD_USER_ROLE_MUTATION,
  REMOVE_USER_ROLE_MUTATION,
  DELETE_USER_MUTATION,
  SAVE_USER_MUTATION,
} from '../../../state/graphql/functions';
import {
  getAllAndSubProp,
  userRolesProp,
} from '../../../state/graphql/props';
import ListDeleteModal from '../../common/list-delete-modal';
import UserModal from './user-modal';

const useStyles = makeStyles(() => ({
  avatarWrapper: {
    display: 'flex',
    alignItems: 'center',
  },
  checkbox: {
    padding: 0,
  },
}));

function UserAccounts(props, context) {
  const {
    currentUser,
    users,
    notifyError,
    subscribeToUsers,
  } = props;
  const classes = useStyles();

  const [userToSave, setUserToSave] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);

  const [deleteUser] = useMutation(DELETE_USER_MUTATION);
  const [saveUser] = useMutation(SAVE_USER_MUTATION);

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

  const handleCreateUser = () => {
    setUserToSave({
      username: '',
      name: '',
      email: '',
      institution: '',
    });
  };

  const handleSave = (payload) => {
    const data = omit(payload, ['id', 'delete', '__typename']);
    const variables = Object.assign({ data }, payload.id && { userId: payload.id });

    saveUser({ variables })
      .then(() => {
        setUserToSave(null);
        notifySuccess(`User ${variables.userId ? 'created' : 'updated'} successfully`);
      })
      .catch((e) => {
        notifyError(e.message);
      });
  };

  const handleDeleteUser = () => {
    const variables = { userId: userToDelete.id };

    deleteUser({ variables })
      .then(() => {
        setUserToDelete(null);
        notifySuccess('Deleted user successfully');
      }).catch((e) => {
        notifyError(e.message);
      });
  };

  return (
    <>
      <Box
        display="flex"
        justifyContent="flex-end"
        marginBottom={2}
      >
        <Button
          variant="contained"
          color="primary"
          onClick={handleCreateUser}
        >
          Add new user
        </Button>
      </Box>
      <Box>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Institution</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {users && users.map((user) => {
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
                    {user.name}
                  </TableCell>
                  <TableCell>
                    {user.email}
                  </TableCell>
                  <TableCell>
                    {user.institution}
                  </TableCell>
                  <TableCell>
                    {currentUser.id !== user.id && (
                      <>
                        <IconButton
                          onClick={() => setUserToSave(user)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => setUserToDelete(user)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>
      <ListDeleteModal
        close={() => setUserToDelete(null)}
        deleteItem={handleDeleteUser}
        itemName={`user: "${(userToDelete && userToDelete.username)}"`}
        show={Boolean(userToDelete)}
      />
      {userToSave && (
        <UserModal
          initialValues={userToSave}
          onSave={handleSave}
          onClose={() => setUserToSave('')}
        />
      )}
    </>
  );
}

UserAccounts.contextTypes = {
  router: PropTypes.object.isRequired,
};

UserAccounts.propTypes = {
  currentUser: PropTypes.object.isRequired,
  users: PropTypes.array,
  addUserRole: PropTypes.func.isRequired,
  removeUserRole: PropTypes.func.isRequired,
  notifyError: PropTypes.func.isRequired,
  subscribeToUsers: PropTypes.func.isRequired,
};

UserAccounts.defaultProps = {
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
)(UserAccounts);

const mapStateToProps = ({ auth }) => ({
  currentUser: auth.user,
});

export default connect(mapStateToProps, {
  notifySuccess,
  notifyError,
})(PermissionWithData);
