import React, { Component } from 'react';
import {
  ControlLabel,
  Form,
  FormGroup,
  FormControl,
  Button,
} from 'react-bootstrap';
import PropTypes from 'prop-types';

const styles = {
  fieldset: {
    padding: '2rem',
    background: '#f8f9fa',
    marginBottom: '1rem',
  },
};

export default class CollectionAbout extends Component {
  render() {
    const {
      collection,
      saveCollection,
      updateCollection,
    } = this.props;

    return (
      <div>
        <Form onSubmit={saveCollection}>
          <Button
            bsStyle="success"
            type="submit"
            className="pull-right"
          >
            Save
          </Button>
          <h3>About Collection</h3>
          <FormGroup controlId="name">
            <ControlLabel>Collection Name</ControlLabel>
            <FormControl
              type="input"
              value={collection.name || ''}
              inputRef={(input) => { this.name = input; }}
              onChange={() => updateCollection({ name: this.name.value })}
            />
          </FormGroup>

          <FormGroup controlId="description">
            <ControlLabel>Collection Description</ControlLabel>
            <FormControl
              componentClass="textarea"
              value={collection.description || ''}
              inputRef={(input) => { this.description = input; }}
              onChange={() => updateCollection({ description: this.description.value })}
            />
          </FormGroup>
          <fieldset style={styles.fieldset} className={'highlight'}>
            <h3>Study Details</h3>
            <p>
              <strong>Optional:</strong> Leave these fields blank if there are no details to share.
            </p>
            <FormGroup controlId="name">
              <ControlLabel>Study Name</ControlLabel>
              <FormControl
                type="input"
                value={collection.studyName || ''}
                inputRef={(input) => { this.studyName = input; }}
                onChange={() => updateCollection({ studyName: this.studyName.value })}
              />
            </FormGroup>

            <FormGroup controlId="description">
              <ControlLabel>Study Description</ControlLabel> (Optional)
              <FormControl
                componentClass="textarea"
                value={collection.studyDescription || ''}
                inputRef={(input) => { this.studyDescription = input; }}
                onChange={() => updateCollection({ studyDescription: this.studyDescription.value })}
              />
            </FormGroup>
          </fieldset>
        </Form>
      </div>
    );
  }
}

CollectionAbout.propTypes = {
  collection: PropTypes.object,
  saveCollection: PropTypes.func.isRequired,
  updateCollection: PropTypes.func.isRequired,
};

CollectionAbout.defaultProps = {
  collection: null,
};
