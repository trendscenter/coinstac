import React, { Component, PropTypes } from 'react';
import { reduxForm } from 'redux-form';
import { FormGroup, ControlLabel, FormControl, Button } from 'react-bootstrap';

export const fields = ['label', 'description'];

class FormAddConsortium extends Component { // eslint-disable-line
  render() {
    const {
      fields: { description, label },
      handleSubmit,
      loading,
      onResetForm,
      resetForm,
    } = this.props;

    return (
      <form onSubmit={handleSubmit}>
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
        <div className="clearfix">
          <div className="pull-right">
            <Button
              bsStyle="success"
              disabled={loading}
              type="submit"
            >
              <span className="glyphicon glyphicon-ok"></span>
              {' '}
              Submit
            </Button>
            <Button
              bsStyle="link"
              onClick={() => resetForm() && onResetForm()}
              type="reset"
            >
              <span className="glyphicon glyphicon-remove"></span>
              {' '}
              Cancel
            </Button>
          </div>
        </div>
      </form>
    );
  }
}

FormAddConsortium.propTypes = {
  fields: PropTypes.object.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  resetForm: PropTypes.func.isRequired,
  onResetForm: PropTypes.func.isRequired,
};

export default reduxForm({
  form: 'addConsortium',
  fields,
})(FormAddConsortium);
