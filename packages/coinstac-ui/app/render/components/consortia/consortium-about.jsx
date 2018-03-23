import React, { Component } from 'react';
import {
  ControlLabel,
  Form,
  FormGroup,
  FormControl,
  Button,
} from 'react-bootstrap';
import PropTypes from 'prop-types';
import MemberAvatar from '../common/member-avatar';

export default class ConsortiumAbout extends Component {
  render() {
    const {
      consortium,
      owner,
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
            <div>
              <FormGroup controlId="owners">
                <ControlLabel>Owner(s)</ControlLabel>
                <div>
                  {consortium.owners.map(owner =>
                    <MemberAvatar key={owner} name={owner} width={50} />
                  )}
                </div>
              </FormGroup>

              <FormGroup controlId="owners">
                <ControlLabel>Members</ControlLabel>
                <div>
                  {consortium.members.map(member =>
                    <MemberAvatar key={member} name={member} width={50} />
                  )}
                  {!consortium.members.length && <em>No members have joined</em>}
                </div>
              </FormGroup>
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
  saveConsortium: PropTypes.func.isRequired,
  updateConsortium: PropTypes.func.isRequired,
};

ConsortiumAbout.defaultProps = {
  consortium: null,
};

