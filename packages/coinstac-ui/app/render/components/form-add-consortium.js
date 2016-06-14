import React, { Component, PropTypes } from 'react';
import { reduxForm } from 'redux-form';
import { FormGroup, ControlLabel, FormControl, ButtonToolbar, Button } from 'react-bootstrap';
export const fields = ['label', 'description'];

class FormAddConsortium extends Component { // eslint-disable-line
  render() {
    const {
      fields: { label, description },
      handleSubmit,
      resetForm,
      loading,
    } = this.props;
    return (
      <form onSubmit={handleSubmit}>
        <h1>Add New Consortium</h1>
        <FormGroup controlId="name">
          <ControlLabel>Name</ControlLabel>
          <FormControl type="text" placeholder="Enter Name" {...label} />
        </FormGroup>
        <FormGroup controlId="name">
          <ControlLabel>Description</ControlLabel>
          <FormControl
            componentClass="textarea"
            placeholder="Enter Description"
            {...description}
            // required for reset form to work (only on textarea's)
            // see: https://github.com/facebook/react/issues/2533
            value={description.value || ''}
          />
        </FormGroup>
        <ButtonToolbar>
          <Button bsStyle="primary" type="submit" disabled={loading.isLoading}>
            Submit
          </Button>
          <Button onClick={resetForm && this.props.onCancel()}>Cancel</Button>
        </ButtonToolbar>
      </form>
    );
  }
}

FormAddConsortium.propTypes = {
  fields: PropTypes.object.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  loading: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  resetForm: PropTypes.func.isRequired,
};

export default reduxForm({
  form: 'addConsortium',
  fields,
})(FormAddConsortium);
