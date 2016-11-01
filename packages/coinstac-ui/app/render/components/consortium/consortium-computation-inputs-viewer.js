import React, { PropTypes } from 'react';

/**
 * @param {Object} props
 * @param {Object[]} props.inputs
 * @param {Object[]} props.values
 * @returns {React.Component}
 */
export default function ConsortiumComputationInputsViewer(props) {
  const { inputs, values } = props;

  return (
    <div className="consortium-computation-inputs-viewer panel panel-default">
      <div className="panel-heading">
        <h2 className="panel-title">Computation Inputs</h2>
      </div>
      <div className="panel-body">
        <ul className="list-unstyled">
          {inputs.map((input, index) => {
            let value;

            if (!(index in values)) {
              value = '';
            } else if (input.type === 'covariates') {
              value = values[index].map(v => v.name).join(', ');
            } else {
              value = values[index].toString();
            }

            return (
              <li key={index}>
                <strong>{input.label}:</strong> {value}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

ConsortiumComputationInputsViewer.propTypes = {
  inputs: PropTypes.arrayOf(PropTypes.object).isRequired,
  values: PropTypes.array.isRequired,
};
