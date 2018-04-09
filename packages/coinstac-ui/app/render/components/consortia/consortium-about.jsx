import React, { Component } from 'react';
import {
  ControlLabel,
  Form,
  FormGroup,
  FormControl,
  Button,
  Table,
} from 'react-bootstrap';
import { Typeahead } from 'react-bootstrap-typeahead';
import PropTypes from 'prop-types';
import MemberAvatar from '../common/member-avatar';

export default class ConsortiumAbout extends Component {
  constructor(props) {
    super(props);

    this.state = {
      newMember: null,
    };

    this.addMember = this.addMember.bind(this);
  }

  addMember() {
    this.props.addMemberToConsortium(this.state.newMember[0].id);
  }

  render() {
    const {
      consortium,
      consortiumUsers,
      owner,
      removeMemberFromConsortium,
      saveConsortium,
      updateConsortium,
      users,
    } = this.props;

    return (
      <div>
        <Form onSubmit={saveConsortium}>
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
            <ControlLabel>Description</ControlLabel>
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
              <div style={{ width: '50%', display: 'inline-block', marginRight: 15 }}>
                <Typeahead
                  filterBy={(option, props) =>
                    consortiumUsers.findIndex(consUser => consUser.id === option.id) === -1
                  }
                  onChange={(selected) => this.setState({ newMember: selected })}
                  labelKey="id"
                  options={users}
                  selected={this.state.newMember}
                />
              </div>
              <Button
                bsStyle="info"
                onClick={this.addMember}
              >
                Add Member
              </Button>
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
                  {consortiumUsers.map(user =>
                    (
                      <tr key={`${user.id}-row`}>
                        <td>
                          <MemberAvatar
                            isOwner={owner}
                            consRole="Member"
                            name={user.id}
                            removeFunction={removeMemberFromConsortium}
                            width={30}
                          />
                          <span>{user.id}</span>
                        </td>
                        <td>
                          {user.owner &&
                            <span
                              aria-hidden="true"
                              className="glyphicon glyphicon-ok-circle"
                              style={{ color: 'green' }}
                            />
                          }
                        </td>
                        <td>
                          {user.member &&
                            <span
                              aria-hidden="true"
                              className="glyphicon glyphicon-ok-circle"
                              style={{ color: 'green' }}
                            />
                          }
                        </td>
                        {owner && <td />}
                      </tr>
                    )
                  )}
                </tbody>
              </Table>
            </div>
          }

          {owner &&
            <Button
              bsStyle="success"
              type="submit"
              className="pull-right"
            >
              Save
            </Button>
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

