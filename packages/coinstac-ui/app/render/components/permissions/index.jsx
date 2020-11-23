import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { graphql, compose, withApollo } from 'react-apollo';
import { get } from 'lodash';
import {
  Checkbox,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
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
} from '../../state/graphql/functions';
import { getGraphQLErrorMessage } from '../../utils/helpers';

const styles = () => ({
  avatarWrapper: {
    display: 'flex',
    alignItems: 'center',
  },
  checkbox: {
    padding: 0,
  },
});

class Permission extends Component {
  state = {
    isUpdating: null,
  }

  componentDidMount() {
    const { currentUser, subscribeToUsers } = this.props;
    const { router } = this.context;

    if (!get(currentUser, 'permissions.roles.admin')) {
      router.push('/');
    } else {
      this.unsubscribeUsers = subscribeToUsers(null);
    }
  }

  componentWillUnmount() {
    if (this.unsubscribeUsers) {
      this.unsubscribeUsers();
    }
  }

  logoutUser = () => {
    const { logout } = this.props;
    const { router } = this.context;

    logout()
      .then(() => {
        router.push('/login');
      });
  }

  toggleUserAppRole = (userId, checked, role) => {
    const {
      currentUser, addUserRole, removeUserRole, notifyError,
    } = this.props;
    const mutation = checked ? addUserRole : removeUserRole;

    this.setState({ isUpdating: { userId, role } });

    mutation(userId, 'app', role, role, 'app')
      .then(() => {
        if (currentUser.id === userId && role === 'admin') {
          this.logoutUser();
        }
      })
      .catch((error) => {
        notifyError(getGraphQLErrorMessage(error));
      })
      .finally(() => {
        this.setState({ isUpdating: null });
      });
  }

  render() {
    const { currentUser, users, classes } = this.props;
    const { isUpdating } = this.state;

    const updatingUserId = get(isUpdating, 'userId');
    const updatingRole = get(isUpdating, 'role');

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
              </TableRow>
            </TableHead>
            <TableBody>
              {users && users.map((user) => {
                const isAdmin = get(user, 'permissions.roles.admin', false);
                const isAuthor = get(user, 'permissions.roles.author', false);

                const isUpdatingAdmin = updatingUserId === user.id && updatingRole === 'admin';
                const isUpdatingAuthor = updatingUserId === user.id && updatingRole === 'author';

                return (
                  <TableRow key={`${user.id}-row`}>
                    <TableCell>
                      <div className={classes.avatarWrapper}>
                        <MemberAvatar
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
                      {isUpdatingAdmin ? (
                        <CircularProgress size={20} />
                      ) : (
                        <Checkbox
                          className={classes.checkbox}
                          checked={isAdmin}
                          disabled={user.id === currentUser.id}
                          name="Admin"
                          onChange={() => this.toggleUserAppRole(user.id, !isAdmin, 'admin')}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {isUpdatingAuthor ? (
                        <CircularProgress />
                      ) : (
                        <Checkbox
                          className={classes.checkbox}
                          checked={isAuthor}
                          disabled={user.id === currentUser.id}
                          name="Author"
                          onChange={() => this.toggleUserAppRole(user.id, !isAuthor, 'author')}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }
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
