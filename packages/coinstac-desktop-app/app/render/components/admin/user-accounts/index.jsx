import { useMutation } from '@apollo/client';
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
import { flowRight as compose, get, omit } from 'lodash';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { notifyError, notifySuccess } from '../../../state/ducks/notifyAndLog';
import {
  DELETE_USER_MUTATION,
  FETCH_ALL_USERS_QUERY,
  SAVE_USER_MUTATION,
  USER_CHANGED_SUBSCRIPTION,
} from '../../../state/graphql/functions';
import { getAllAndSubProp } from '../../../state/graphql/props';
import ListDeleteModal from '../../common/list-delete-modal';
import MemberAvatar from '../../common/member-avatar';
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

function UserAccounts({
  users,
  subscribeToUsers,
}, { router }) {
  const currentUser = useSelector(state => state.auth.user);
  const dispatch = useDispatch();

  const classes = useStyles();

  const [userToSave, setUserToSave] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);

  const [deleteUser] = useMutation(DELETE_USER_MUTATION);
  const [saveUser] = useMutation(SAVE_USER_MUTATION);

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
        dispatch(notifySuccess(`User ${variables.userId ? 'created' : 'updated'} successfully`));
      })
      .catch((e) => {
        dispatch(notifyError(e.message));
      });
  };

  const handleDeleteUser = () => {
    const variables = { userId: userToDelete.id };

    deleteUser({ variables })
      .then(() => {
        setUserToDelete(null);
        dispatch(notifySuccess('Deleted user successfully'));
      }).catch((e) => {
        dispatch(notifyError(e.message));
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
            {users && users.map(user => (
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
            ))}
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
  users: PropTypes.array,
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
    'userChanged',
  )),
  withApollo,
)(UserAccounts);

export default PermissionWithData;
