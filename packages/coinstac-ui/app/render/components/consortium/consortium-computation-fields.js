import React, { PropTypes } from 'react';
import { Field, FieldArray } from 'redux-form';
import { round } from 'lodash';

import ComputationFieldBasic from '../computation-field-basic';
import ComputationFieldCovariates from '../computation-field-covariates';

/**
 * Normalize numeric input.
 *
 * {@link http://redux-form.com/6.6.0/examples/normalizing/}
 *
 * @param {number} value
 * @returns {number} Normalized value
 */
const normalizer = value => round(value, 3);

/**
 * Consortium computation fields.
 *
 * @param {Object} props
 * @param {Object[]} props.computationInputs Collection of field description objects
 * @param {Object} props.fields Collection of Redux Form fields
 * @returns {React.Component}
 */
export default function ConsortiumComputationFields({
  computationInputs,
  fields,
}) {
  return (
    <ol className="list-unstyled">
      {fields.map((name, index) => {
        const fieldProps = Object.assign({ name }, computationInputs[index]);
        let component;

        if (fieldProps.type === 'covariates') {
          component = (
            <FieldArray
              component={ComputationFieldCovariates}
              {...fieldProps}
            />
          );
        } else {
          if (fieldProps.type === 'number') {
            fieldProps.normalize = normalizer;
          }

          component = (
            <Field
              component={ComputationFieldBasic}
              {...fieldProps}
            />
          );
        }

        return <li key={index}>{component}</li>;
      })}
    </ol>
  );
}

ConsortiumComputationFields.propTypes = {
  computationInputs: PropTypes.arrayOf(PropTypes.object).isRequired,
  fields: PropTypes.shape({
    map: PropTypes.func.isRequired,
  }).isRequired,
};
