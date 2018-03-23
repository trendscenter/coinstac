import React, { Component } from 'react';
import {
  ControlLabel,
  Form,
  FormGroup,
  FormControl,
  Button,
  Table,
} from 'react-bootstrap';
import PropTypes from 'prop-types';
import MemberAvatar from '../common/member-avatar';

export default class ConsortiumAbout extends Component {
  render() {
    const {
      consortium,
      owner,
      removeMemberFromConsortium,
      saveConsortium,
      updateConsortium,
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
              <span className="bold">Owner(s)/Members: </span><br />
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
                  {consortium.owners.map(user =>
                    (
                      <tr>
                        <td>
                          <MemberAvatar
                            key={`${user}-avatar`}
                            isOwner={owner}
                            consRole="Member"
                            name={user}
                            removeFunction={removeMemberFromConsortium}
                            width={30}
                          />
                          <span>{user}</span>
                        </td>
                        <td>
                          <span
                            aria-hidden="true"
                            className="glyphicon glyphicon-ok-circle"
                            style={{ color: 'green' }}
                          />
                        </td>
                        <td />
                        {owner && <td />}
                      </tr>
                    )
                  )}
                  {consortium.members.map(user =>
                    (
                      <tr>
                        <td>
                          <MemberAvatar
                            key={`${user}-avatar`}
                            isOwner={owner}
                            consRole="Member"
                            name={user}
                            removeFunction={removeMemberFromConsortium}
                            width={30}
                          />
                          <span>{user}</span>
                        </td>
                        <td />
                        <td>
                          <span
                            aria-hidden="true"
                            className="glyphicon glyphicon-ok-circle"
                            style={{ color: 'green' }}
                          />
                        </td>
                        {owner &&
                          <td>
                            <Button
                              bsStyle="danger"
                              onClick={removeMemberFromConsortium(user)}
                            >
                              <span
                                aria-hidden="true"
                                className="glyphicon glyphicon-remove"
                              /> Remove
                            </Button>
                          </td>
                        }
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

