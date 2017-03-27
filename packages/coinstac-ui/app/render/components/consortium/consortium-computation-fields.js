import React, { PropTypes } from 'react';
import { Field, FieldArray } from 'redux-form';

import ComputationFieldBasic from '../computation-field-basic';
import ComputationFieldCovariates from '../computation-field-covariates';

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
        const field = computationInputs[index];
        const component = field.type === 'covariates' ?
          <FieldArray
            component={ComputationFieldCovariates}
            name={name}
            {...field}
          /> :
          <Field
            component={ComputationFieldBasic}
            name={name}
            {...field}
          />;

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
