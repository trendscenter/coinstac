import React, { Component } from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import Typography from '@material-ui/core/Typography';
import Checkbox from '@material-ui/core/Checkbox';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import { withStyles } from '@material-ui/core/styles';
import DeleteIcon from '@material-ui/icons/Delete';
import PropTypes from 'prop-types';
import { ValidatorForm, TextValidator } from 'react-material-ui-form-validator';
import memoize from 'memoize-one';
import Select from '../common/react-select';
import MemberAvatar from '../common/member-avatar';
import StatusButtonWrapper from '../common/status-button-wrapper';

const styles = theme => ({
  tabTitleContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing(2),
  },
  textField: {
    marginTop: theme.spacing(2),
  },
  membersContainer: {
    marginTop: theme.spacing(4),
  },
  addMemberContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  addMemberButton: {
    marginLeft: theme.spacing(2),
  },
});

class ConsortiumAbout extends Component {
  state = {
    newMember: null,
    isAddingMember: false,
  };

  mapUsers = memoize(
    users => (users ? users.map(user => ({ label: user.id, value: user.id })) : null)
  );

  filterSelectedUsers = memoize(
    (allUsers, selectedUsers) => {
      if (!allUsers && selectedUsers) {
        return null;
      }

      return allUsers.filter(user => selectedUsers.findIndex(
        selectedUser => selectedUser.id === user.value
      ) === -1);
    }
  );

  handleTextFieldChange = name => (event) => {
    const { updateConsortium } = this.props;
    updateConsortium({ param: name, value: event.target.value });
  }

  handleSwitchChange = name => (event) => {
    const { updateConsortium } = this.props;
    updateConsortium({ param: name, value: event.target.checked });
  }

  toggleOwner = (consUser) => {
    const {
      consortium, owner, user, addUserRole, removeUserRole,
    } = this.props;

    if (owner && consUser.id !== user.id) {
      if (consUser.owner) {
        removeUserRole(consUser.id, 'consortia', consortium.id, 'owner');
      } else {
        addUserRole(consUser.id, 'consortia', consortium.id, 'owner');
      }
    }
  }

  handleMemberSelect = (value) => {
    this.setState({ newMember: value });
  }

  addMember = () => {
    const { consortium, addUserRole } = this.props;
    const { newMember } = this.state;

    this.setState({ isAddingMember: true });

    addUserRole(newMember.value, 'consortia', consortium.id, 'member')
      .then(() => {
        this.setState({ newMember: null });
      })
      .finally(() => {
        this.setState({ isAddingMember: false });
      });
  }

  removeMember = (user) => {
    const { consortium, removeUserRole } = this.props;

    removeUserRole(user.id, 'consortia', consortium.id, 'owner');
    removeUserRole(user.id, 'consortia', consortium.id, 'member');
  }

  render() {
    const {
      consortium,
      owner,
      user,
      users,
      classes,
      savingStatus,
      saveConsortium,
      consortiumUsers,
    } = this.props;

    const { newMember, isAddingMember } = this.state;

    const allUsers = this.mapUsers(users);
    const userOptions = this.filterSelectedUsers(allUsers, consortiumUsers);

    return (
      <ValidatorForm onSubmit={saveConsortium} instantValidate noValidate>
        <div className={classes.tabTitleContainer}>
          <Typography variant="h5">
            About Consortium
          </Typography>
          {owner && (
            <StatusButtonWrapper status={savingStatus}>
              <Button
                variant="contained"
                color="primary"
                type="submit"
                disabled={savingStatus === 'pending'}
              >
                Save
              </Button>
            </StatusButtonWrapper>)}
        </div>
        <TextValidator
          id="name"
          label="Name"
          fullWidth
          disabled={!owner}
          value={consortium.name}
          name="name"
          required
          validators={['required']}
          errorMessages={['Consortium name is required']}
          className={classes.textField}
          withRequiredValidator
          onChange={this.handleTextFieldChange('name')}
        />
        <TextField
          id="description"
          label="Description"
          fullWidth
          disabled={!owner}
          value={consortium.description}
          className={classes.textField}
          onChange={this.handleTextFieldChange('description')}
        />
        <FormControlLabel
          control={
            <Switch checked={consortium.isPrivate} value={consortium.isPrivate} onChange={this.handleSwitchChange('isPrivate')} />
          }
          label="Turn consortia private?"
        />
        {consortium.id
          && (
          <div key="avatar-container" className={classes.membersContainer}>
            <Typography variant="subtitle2">Owner(s)/Members:</Typography>
            {
              owner && (
                <div className={classes.addMemberContainer}>
                  <Select
                    value={newMember}
                    placeholder="Select an user"
                    options={userOptions}
                    onChange={this.handleMemberSelect}
                    removeSelected
                    className="consortium-add-user"
                    name="members-input"
                  />
                  <Button
                    className={classes.addMemberButton}
                    variant="contained"
                    color="secondary"
                    disabled={!newMember || isAddingMember}
                    onClick={this.addMember}
                  >
                      Add Member
                  </Button>
                </div>
              )
            }
            <Table size="small" id="consortium-member-table">
              <TableHead>
                <TableRow>
                  <TableCell>Username</TableCell>
                  <TableCell>Owner</TableCell>
                  <TableCell>Member</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {consortiumUsers.map(consUser => (
                  <TableRow key={`${consUser.id}-row`}>
                    <TableCell>
                      <MemberAvatar
                        isOwner={owner}
                        consRole="Member"
                        name={consUser.id}
                        width={30}
                      />
                      <span>{consUser.id}</span>
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        onChange={() => this.toggleOwner(consUser)}
                        checked={!!consUser.owner}
                        disabled={!owner || consUser.id === user.id}
                        name="isOwner"
                      />
                    </TableCell>
                    <TableCell>
                      <Checkbox disabled checked={consUser.member} name="isMember" />
                    </TableCell>
                    <TableCell>
                      {owner && user.id !== consUser.id && (
                        <Button
                          variant="contained"
                          color="default"
                          onClick={() => this.removeMember(consUser)}
                        >
                              Remove
                          <DeleteIcon />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          )
        }
      </ValidatorForm>
    );
  }
}

ConsortiumAbout.propTypes = {
  classes: PropTypes.object.isRequired,
  consortium: PropTypes.object,
  owner: PropTypes.bool.isRequired,
  savingStatus: PropTypes.string,
  user: PropTypes.object.isRequired,
  users: PropTypes.array,
  addUserRole: PropTypes.func.isRequired,
  removeUserRole: PropTypes.func.isRequired,
  saveConsortium: PropTypes.func.isRequired,
  updateConsortium: PropTypes.func.isRequired,
  consortiumUsers: PropTypes.array,
};

ConsortiumAbout.defaultProps = {
  consortium: null,
  users: [],
  savingStatus: 'init',
  consortiumUsers: [],
};

export default withStyles(styles)(ConsortiumAbout);
