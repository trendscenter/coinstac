import React from 'react';
import PropTypes from 'prop-types';
import { Field } from 'redux-form';
import {
  Alert,
  Button,
  ControlLabel,
  FormControl,
  FormGroup,
  HelpBlock,
} from 'react-bootstrap';

function covariateName({
  input: {
    onChange,
    value,
  },
}) {
  return (
    <FormControl
      onChange={onChange}
      value={value}
    />
  );
}

covariateName.propTypes = {
  input: PropTypes.shape({
    onChange: PropTypes.func.isRequired,
    value: PropTypes.string.isRequired,
  }).isRequired,
};

function covariateType({
  input: {
    onChange,
    value,
  },
}) {
  /* eslint-disable no-use-before-define */
  const options = Array.from(ComputationFieldCovariates.typeMap).map(
    ([value, name]) => <option key={value} value={value}>{name}</option>
  );
  /* eslint-disable no-use-before-define */

  return (
    <FormControl
      componentClass="select"
      onChange={onChange}
      value={value}
    >
      <option disabled key={0} value="">Choose…</option>
      {options}
    </FormControl>
  );
}

covariateType.propTypes = {
  input: PropTypes.shape({
    onChange: PropTypes.func.isRequired,
    value: PropTypes.oneOf(['', 'boolean', 'number']),
  }).isRequired,
};

export default function ComputationFieldCovariates({
  fields,
  help,
  label,
  meta: {
    error,
    submitFailed,
    touched,
  },
}) {
  const lastItem = fields.get(fields.length - 1);
  const isAddDisabled = !!lastItem && !lastItem.name && !lastItem.type;
  const helpBlock = help ? <HelpBlock>{help}</HelpBlock> : undefined;
  const errorBlock = (submitFailed || touched) && error ?
    <Alert bsStyle="danger">{error}</Alert> :
    undefined;

  return (
    <fieldset className="computation-field-covariates">
      <legend>{label}</legend>
      {helpBlock}
      {errorBlock}
      <ol className="list-unstyled">
        {fields.map((name, index) => {
          return (
            <li key={index}>
              <div className="row">
                <FormGroup
                  className="col-xs-5"
                  controlId={`computation-field-map-name-${index}`}
                >
                  <ControlLabel>Name</ControlLabel>
                  <Field
                    component={covariateName}
                    name={`${name}.name`}
                  />
                </FormGroup>
                <FormGroup
                  className="col-xs-5"
                  controlId={`computation-field-map-type-${index}`}
                >
                  <ControlLabel>Type</ControlLabel>
                  <Field
                    component={covariateType}
                    name={`${name}.type`}
                  />
                </FormGroup>
                <div className="col-xs-2">
                  <Button
                    block
                    bsStyle="danger"
                    onClick={() => fields.remove(index)}
                  >
                    <span
                      aria-hidden="true"
                      className="glyphicon glyphicon-minus"
                    />
                    {' '}
                    Delete
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="row">
        <div className="col-xs-2 col-xs-push-10">
          <Button
            block
            bsStyle="primary"
            disabled={isAddDisabled}
            onClick={() => fields.push({
              name: '',
              type: '',
            })}
          >
            <span
              aria-hidden="true"
              className="glyphicon glyphicon-plus"
            />
            {' '}
            New
          </Button>
        </div>
      </div>
    </fieldset>
  );
}


ComputationFieldCovariates.propTypes = {
  // disabled: PropTypes.bool.isRequired,
  help: PropTypes.string,
  fields: PropTypes.shape({
    map: PropTypes.func.isRequired,
  }).isRequired,
  label: PropTypes.string.isRequired,
  meta: PropTypes.shape({
    error: PropTypes.string,
  }).isRequired,
};

/**
 * Covariate types.
 *
 * @const {Map}
 */
ComputationFieldCovariates.typeMap = new Map([
  ['boolean', 'True/False'],
  ['number', 'Number'],
]);

