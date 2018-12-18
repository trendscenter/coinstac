import React, { Component } from 'react';
import {
  Checkbox,
  ControlLabel,
  FormGroup,
  FormControl,
  Table,
} from 'react-bootstrap';
import { Typeahead } from 'react-bootstrap-typeahead';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core';
import PropTypes from 'prop-types';
import update from 'immutability-helper';
import MemberAvatar from '../common/member-avatar';

const styles = theme => ({
  tabTitleContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.unit * 2,
  },
});

class ConsortiumAbout extends Component {
  constructor(props) {
    super(props);

    this.state = {
      consortiumUsers: [],
      newMember: null,
    };

    this.addMember = this.addMember.bind(this);
    this.toggleOwner = this.toggleOwner.bind(this);
  }

  static getDerivedStateFromProps(props) {
    if (props.consortiumUsers) {
      return {
        consortiumUsers: props.consortiumUsers.sort((a, b) => a.id.localeCompare(b.id)),
      };
    }
    return null;
  }

  addMember() {
    const newMember = this.state.newMember;
    this.props.addMemberToConsortium(newMember[0].id);
  }

  toggleOwner(consUser) {
    const { addUserRole, consortium, owner, removeUserRole, user } = this.props;
    return () => {
      if (owner && consUser.id !== user.id) {
        if (consUser.owner) {
          removeUserRole(consUser.id, 'consortia', consortium.id, 'owner');
          addUserRole(consUser.id, 'consortia', consortium.id, 'member');
        } else {
          addUserRole(consUser.id, 'consortia', consortium.id, 'owner');
          removeUserRole(consUser.id, 'consortia', consortium.id, 'member');
        }
      }
    };
  }

  handleTextFieldChange = name => event => {
    const { updateConsortium } = this.props;
    updateConsortium({ param: name, value: event.target.value });
  }

  render() {
    const {
      consortium,
      owner,
      removeMemberFromConsortium,
      saveConsortium,
      user,
      users,
      classes,
    } = this.props;

    const { consortiumUsers } = this.state;

    return (
      <form onSubmit={saveConsortium}>
        <div className={classes.tabTitleContainer}>
          <Typography variant="h5">
            About Consortium
          </Typography>
          {
            owner
            && (
              <Button
                variant="contained"
                color="primary"
                type="submit"
              >
                Save
              </Button>
            )
          }
        </div>
        <TextField
          id="name"
          label="Name"
          required
          disabled={!owner}
          value={consortium.name}
          onChange={this.handleTextFieldChange('name')}
        />
        <TextField
          id="description"
          label="Description"
          disabled={!owner}
          value={consortium.name}
          onChange={this.handleTextFieldChange('description')}
        />

        {
          consortium.id &&
          <div key="avatar-container">
            <div className="bold" style={{ marginBottom: 15 }}>Owner(s)/Members: </div>
            {
              owner &&
              <div>
                <div style={{ width: '50%', display: 'inline-block', marginRight: 15 }}>
                  <Typeahead
                    filterBy={(option, props) =>
                      consortiumUsers.findIndex(consUser => consUser.id === option.id) === -1
                    }
                    onChange={(selected) => this.setState({ newMember: selected })}
                    labelKey="id"
                    options={users}
                    selected={this.state.newMember}
                    selectHintOnEnter
                  />
                </div>
                <Button
                  bsStyle="info"
                  onClick={this.addMember}
                >
                  Add Member
                </Button>
              </div>
            }
            <Table striped condensed>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Owner</th>
                  <th>Member</th>
                  {owner && <th />}
                </tr>
              </thead>
              <tbody>
                {consortiumUsers.map(consUser =>
                  (
                    <tr key={`${consUser.id}-row`}>
                      <td>
                        <MemberAvatar
                          isOwner={owner}
                          consRole="Member"
                          name={consUser.id}
                          width={30}
                        />
                        <span>{consUser.id}</span>
                      </td>
                      <td>
                        <Checkbox
                          onChange={this.toggleOwner(consUser)}
                          checked={consUser.owner ? true : false}
                          disabled={!owner || consUser.id === user.id}
                        />
                      </td>
                      <td>
                        <Checkbox disabled checked={consUser.member} />
                      </td>
                      {owner &&
                        <td>
                          { user.id !== consUser.id ?
                          <Button
                            bsStyle="danger"
                            onClick={removeMemberFromConsortium(consUser)}
                          >
                            <span
                              aria-hidden="true"
                              className="glyphicon glyphicon-remove"
                            /> Remove
                          </Button>
                          : ''}
                        </td>
                      }
                    </tr>
                  )
                )}
              </tbody>
            </Table>
          </div>
        }
      </form>
    );
  }
}

ConsortiumAbout.propTypes = {
  consortium: PropTypes.object,
  owner: PropTypes.bool.isRequired,
  removeMemberFromConsortium: PropTypes.func.isRequired,
  saveConsortium: PropTypes.func.isRequired,
  updateConsortium: PropTypes.func.isRequired,
};

ConsortiumAbout.defaultProps = {
  consortium: null,
};

export default withStyles(styles)(ConsortiumAbout);
