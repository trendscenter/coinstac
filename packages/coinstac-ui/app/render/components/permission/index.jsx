import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { graphql, compose, withApollo } from 'react-apollo'
import { get } from 'lodash'
import {
  Checkbox,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import MemberAvatar from '../common/member-avatar'
import {
  getAllAndSubProp,
  userRolesProp,
} from '../../state/graphql/props'
import {
  FETCH_ALL_USERS_QUERY,
  USER_CHANGED_SUBSCRIPTION,
  ADD_USER_ROLE_MUTATION,
  REMOVE_USER_ROLE_MUTATION,
} from '../../state/graphql/functions'

const styles = () => ({
  avatarWrapper: {
    display: 'flex',
    alignItems: 'center',
  },
  checkbox: {
    padding: 0,
  }
})

class Permission extends Component {
  state = {
    isUpdating: null,
  }

  toggleUserAppRole = (user, checked, role) => {
    const { addUserRole, removeUserRole } = this.props
    const mutation = checked ? addUserRole : removeUserRole

    this.setState({ isUpdating: { userId: user.id, role }})

    mutation(user.id, 'app', role, role, 'app')
      .finally(() => {
        this.setState({ isUpdating: null })
      })
  }

  render() {
    const { users, classes } = this.props
    const { isUpdating } = this.state

    const updatingUserId = get(isUpdating, 'userId')
    const updatingRole = get(isUpdating, 'role')

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
                <TableCell>Admin</TableCell>
                <TableCell>Author</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users && users.map(user => {
                const isAdmin = get(user, 'permissions.roles.admin', false)
                const isAuthor = get(user, 'permissions.roles.author', false)

                const isUpdatingAdmin = updatingUserId === user.id && updatingRole === 'admin'
                const isUpdatingAuthor = updatingUserId === user.id && updatingRole === 'author'

                return (
                  <TableRow key={`${user.id}-row`}>
                    <TableCell>
                      <div className={classes.avatarWrapper}>
                        <MemberAvatar
                          name={user.id}
                          width={30}
                        />
                        <span>{user.id}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {isUpdatingAdmin ? (
                        <CircularProgress size={20} />
                      ) : (
                        <Checkbox
                          className={classes.checkbox}
                          checked={isAdmin}
                          name="Admin"
                          onChange={() => this.toggleUserAppRole(user, !isAdmin, 'admin')}
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
                          name="Author"
                          onChange={() => this.toggleUserAppRole(user, !isAuthor, 'author')}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }
}

Permission.propTypes = {
  users: PropTypes.array,
  addUserRole: PropTypes.func.isRequired,
  removeUserRole: PropTypes.func.isRequired,
}

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
  withApollo,
)(Permission)

const mapStateToProps = ({ auth }) => ({
  user: auth.user,
})

const connectedComponent = connect(mapStateToProps)(PermissionWithData)

export default withStyles(styles, { withTheme: true })(connectedComponent)
