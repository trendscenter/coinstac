import React, { Component } from 'react';
import Joyride from 'react-joyride';
import Box from '@material-ui/core/Box';
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
import { omit } from 'lodash';
import Select from '../common/react-select';
import MemberAvatar from '../common/member-avatar';
import StatusButtonWrapper from '../common/status-button-wrapper';
import STEPS from '../../constants/tutorial';

const styles = theme => ({
  textField: {
    marginTop: theme.spacing(2),
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
    users => (users ? users.map(user => ({ label: user.username, value: user.id })) : null)
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
      consortium, owner, user, addUserRole, removeUserRole, updateConsortium,
    } = this.props;

    if (owner && consUser.id !== user.id) {
      if (consUser.owner) {
        removeUserRole(consUser.id, 'consortia', consortium.id, 'owner', 'data')
          .then(({ data }) => {
            updateConsortium({ param: 'owners', value: omit(consortium.owners, [data.removeUserRole.id]) });
          });
      } else {
        addUserRole(consUser.id, 'consortia', consortium.id, 'owner', 'data')
          .then(({ data }) => {
            updateConsortium({
              param: 'owners',
              value: {
                ...consortium.owners,
                [data.addUserRole.id]: data.addUserRole.username,
              },
            });
          });
      }
    }
  }

  handleMemberSelect = (value) => {
    this.setState({ newMember: value });
  }

  addMember = () => {
    const { consortium, addUserRole, updateConsortium } = this.props;
    const { newMember } = this.state;

    this.setState({ isAddingMember: true });

    addUserRole(newMember.value, 'consortia', consortium.id, 'member', 'data')
      .then(({ data }) => {
        this.setState({ newMember: null });
        updateConsortium({
          param: 'members',
          value: {
            ...consortium.members,
            [data.addUserRole.id]: data.addUserRole.username,
          },
        });
      })
      .finally(() => {
        this.setState({ isAddingMember: false });
      });
  }

  removeMember = (user) => {
    const { consortium, removeUserRole, updateConsortium } = this.props;

    removeUserRole(user.id, 'consortia', consortium.id, 'owner', 'data').then(({ data }) => {
      updateConsortium({ param: 'owners', value: omit(consortium.owners, [data.removeUserRole.id]) });
    });

    removeUserRole(user.id, 'consortia', consortium.id, 'member', 'data').then(({ data }) => {
      updateConsortium({ param: 'members', value: omit(consortium.owners, [data.removeUserRole.id]) });
    });
  }

  render() {
    const {
      consortium,
      owner,
      user,
      users,
      classes,
      savingStatus,
      isTutorialHidden,
      saveConsortium,
      consortiumUsers,
      tutorialChange,
    } = this.props;

    const { newMember, isAddingMember } = this.state;

    const allUsers = this.mapUsers(users);
    const userOptions = this.filterSelectedUsers(allUsers, consortiumUsers);

    return (
      <ValidatorForm onSubmit={saveConsortium} instantValidate noValidate>
        <Box display="flex" justifyContent="space-between" alignItems="center" marginTop={2}>
          <Typography variant="h5">
            About Consortium
          </Typography>
          {
            owner && (
              <StatusButtonWrapper status={savingStatus}>
                <Button
                  id="save-consortium"
                  variant="contained"
                  color="primary"
                  type="submit"
                  disabled={savingStatus === 'pending'}
                >
                  Save
                </Button>
              </StatusButtonWrapper>
            )
          }
        </Box>
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
        {owner && (
          <FormControlLabel
            control={
              <Switch checked={consortium.isPrivate} value={consortium.isPrivate} onChange={this.handleSwitchChange('isPrivate')} />
            }
            label="Turn consortia private?"
          />
        )}
        {
          consortium.id && (
            <Box marginTop={4}>
              <Typography variant="subtitle2">Owner(s)/Members:</Typography>
              {
                owner && (
                  <Box display="flex" justifyContent="space-between" alignItems="center" marginTop={2} marginBottom={2}>
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
                  </Box>
                )
              }
              <Table id="consortium-member-table">
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
                          id={user.id}
                          isOwner={owner}
                          consRole="Member"
                          name={consUser.name}
                          width={30}
                        />
                        <span>{consUser.name}</span>
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
                      {
                        owner && (
                          <TableCell>
                            {user.id !== consUser.id && (
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
                        )
                      }
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )
        }
        {!isTutorialHidden && (
          <Joyride
            steps={STEPS.consortiumAbout}
            continuous
            disableScrollParentFix
            callback={tutorialChange}
          />
        )}
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
  consortiumUsers: PropTypes.array,
  isTutorialHidden: PropTypes.bool.isRequired,
  addUserRole: PropTypes.func.isRequired,
  removeUserRole: PropTypes.func.isRequired,
  saveConsortium: PropTypes.func.isRequired,
  updateConsortium: PropTypes.func.isRequired,
  tutorialChange: PropTypes.func.isRequired,
};

ConsortiumAbout.defaultProps = {
  consortium: null,
  users: [],
  savingStatus: 'init',
  consortiumUsers: [],
};

export default withStyles(styles)(ConsortiumAbout);
