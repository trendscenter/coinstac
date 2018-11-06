import React, { Component } from 'react';
import {
  Checkbox,
  ControlLabel,
  Form,
  FormGroup,
  FormControl,
  Button,
  Table,
} from 'react-bootstrap';
import { Typeahead } from 'react-bootstrap-typeahead';
import PropTypes from 'prop-types';
import update from 'immutability-helper';
import MemberAvatar from '../common/member-avatar';

export default class ConsortiumAbout extends Component {
  constructor(props) {
    super(props);

    this.state = {
      consortiumUsers: [],
      newMember: null,
    };

    this.addMember = this.addMember.bind(this);
    this.toggleOwner = this.toggleOwner.bind(this);
  }

  static getDerivedStateFromProps(props, state) {
    if (props.consortiumUsers) {
      const users = state.consortiumUsers.filter((stateUser) => {
        props.consortiumUsers.findIndex(propsUser => propsUser.id === stateUser.id) > -1
      });
      props.consortiumUsers.forEach((propsUser) => {
        const stateIndex = state.consortiumUsers.findIndex(stateUser => stateUser.id === propsUser.id);

        if (stateIndex === -1) {
          users.push(propsUser);
        } else {
          users[stateIndex] = propsUser;
        }
      });
      return { consortiumUsers: users };
    }
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
        } else {
          addUserRole(consUser.id, 'consortia', consortium.id, 'owner');
        }
      }
    };
  }

  render() {
    const {
      consortium,
      owner,
      removeMemberFromConsortium,
      saveConsortium,
      updateConsortium,
      user,
      users,
    } = this.props;

    const { consortiumUsers } = this.state;

    return (
      <div>
        <Form onSubmit={saveConsortium}>
          {
            owner &&
            <Button
              bsStyle="success"
              type="submit"
              className="pull-right"
            >
              Save
            </Button>
          }
          <h3>About Consortium</h3>
          <FormGroup controlId="name">
            <ControlLabel>Name</ControlLabel>
            <FormControl
              disabled={!owner}
              type="input"
              value={consortium.name || ''}
              inputRef={(input) => { this.name = input; }}
              onChange={() => updateConsortium({ param: 'name', value: this.name.value })}
            />
          </FormGroup>

          <FormGroup controlId="description">
            <ControlLabel>Description</ControlLabel> (Optional)
            <FormControl
              disabled={!owner}
              componentClass="textarea"
              value={consortium.description || ''}
              inputRef={(input) => { this.description = input; }}
              onChange={() => updateConsortium({ param: 'description', value: this.description.value })}
            />
          </FormGroup>

          {consortium.id &&
            <div key="avatar-container">
              <div className="bold" style={{ marginBottom: 15 }}>Owner(s)/Members: </div>
              {owner &&
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
                            removeFunction={removeMemberFromConsortium}
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
        </Form>
      </div>
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
