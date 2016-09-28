import React, { PropTypes } from 'react';
import ComputationFieldBasic from './computation-field-basic';
import ComputationFieldCovariates from './computation-field-covariates';

export default function ConsortiumComputationFields(props) {
  const {
    activeComputationInputs,
    fields,
    isOwner,
    updateComputationField,
  } = props;

  return (
    <ol className="list-unstyled">
      {fields.map(
        ({ help, label, type, values }, fieldIndex) => {
          const fieldProps = {
            disabled: !isOwner,
            fieldIndex,
            help,
            label,
            onChange: null,
            type,
            value: null,
          };
          let computationField;

          if (type === 'covariates') {
            /**
             * Handle covariate field changes.
             *
             * @todo Move this to a reducer
             *
             * @param {(Object|null)} changeValue
             * @param {number} itemsIndex
             */
            fieldProps.onChange = (changeValue, itemsIndex) => {
              let value = activeComputationInputs[fieldIndex] || [];
              // debugger;
              if (!changeValue) {
                value = value.filter((v, i) => i !== itemsIndex);
              } else if (itemsIndex > value.length - 1) {
                value = value.concat(changeValue);
              } else {
                Object.assign(value[itemsIndex], changeValue);
              }

              updateComputationField(fieldIndex, value);
            };

            if (Array.isArray(activeComputationInputs[fieldIndex])) {
              fieldProps.value = activeComputationInputs[fieldIndex];
            } else {
              fieldProps.value = [];
            }

            computationField = <ComputationFieldCovariates {...fieldProps} />;
          } else {
            if (type === 'number') {
              fieldProps.onChange = event => {
                updateComputationField(
                  fieldIndex,
                  parseInt(event.target.value, 10)
                );
              };

              if (typeof activeComputationInputs[fieldIndex] !== 'undefined') {
                fieldProps.value = activeComputationInputs[fieldIndex];
              }
            } else if (type === 'select') {
              fieldProps.onChange = event => {
                const options = event.target.options;
                const selectedValues = [];

                for (let i = 0, il = options.length; i < il; i++) {
                  if (options[i].selected) {
                    selectedValues.push(values[parseInt(options[i].value, 10)]);
                  }
                }
                updateComputationField(fieldIndex, selectedValues);
              };
              fieldProps.options = values;

              if (values && Array.isArray(activeComputationInputs[fieldIndex])) {
                fieldProps.value = values.reduce((indices, value, index) => {
                  if (activeComputationInputs[fieldIndex].indexOf(value) > -1) {
                    indices.push(index);
                  }

                  return indices;
                }, []);
              }
            }

            computationField = <ComputationFieldBasic {...fieldProps} />;
          }

          return <li key={fieldIndex}>{computationField}</li>;
        }
      )}
    </ol>
  );
}

ConsortiumComputationFields.propTypes = {
  activeComputationInputs: PropTypes.array.isRequired,
  fields: PropTypes.array.isRequired,
  isOwner: PropTypes.bool.isRequired,
  updateComputationField: PropTypes.func.isRequired,
};
