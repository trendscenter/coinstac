import React, { PropTypes } from 'react';

/**
 * Consortium computation inputs viewer.
 *
 * @param {Object} props
 * @param {Object} props.computation
 * @param {Object[]} props.inputs
 * @param {Object[]} props.values
 * @returns {React.Component}
 */
export default function ConsortiumComputationInputsViewer({
  computation,
  inputs,
  values,
}) {
  return (
    <div className="consortium-computation-inputs-viewer panel panel-default">
      <div className="panel-heading">
        <h2 className="panel-title">Computation Inputs</h2>
      </div>
      <div className="panel-body">
        <ul className="list-unstyled">
          <li>
            <strong>Computation:</strong>
            {' '}
            {computation.name}
            {' '}
            <small className="text-muted">Version {computation.version}</small>
          </li>
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
  computation: PropTypes.shape({
    name: PropTypes.string.isRequired,
    version: PropTypes.string.isRequired,
  }),
  inputs: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
  })).isRequired,
  values: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.string,
    PropTypes.shape({
      name: PropTypes.string.isRequired,
    }),
  ]))).isRequired,
};
