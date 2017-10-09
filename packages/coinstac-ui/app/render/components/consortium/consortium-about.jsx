import React, { Component } from 'react';
import {
  ControlLabel,
  Form,
  FormGroup,
  FormControl,
  Button,
} from 'react-bootstrap';
import PropTypes from 'prop-types';

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

