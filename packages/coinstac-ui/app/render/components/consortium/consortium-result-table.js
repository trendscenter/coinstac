import React, { PropTypes } from 'react';

function toTableData(content, index) {
  return <td key={index}><samp>{content}</samp></td>;
}

/**
 * Get formatted data transformed to components.
 *
 * @param {Object} props Computation result
 * @param {string[]} props.covariates
 * @param {Object} props.results
 * @property {number[]} [averageBetaVectors]
 * @property {number[]} pValues
 * @property {number[]} tValues
 * @returns {React.Component}
 */
export default function ConsortiumResultTable({ covariates, results }) {
  let averageBetaVectors;

  if (results.averageBetaVectors) {
    averageBetaVectors = (
      <tr>
        <th scope="row">Averaged Beta Vectors</th>
        {results.averageBetaVectors.map(toTableData)}
      </tr>
    );
  }

  return (
    <table className="consortium-result-table table">
      <thead>
        <tr>
          <th scope="col">
            <span className="sr-only">Row label:</span>
          </th>
          <th scope="col">Beta 0 <span className="text-muted">(Intercept)</span></th>
          {covariates.map((covariate, i) => (
            <th key={i} scope="col">
              Beta {` ${i + 1} `}
              <span className="text-muted">({covariate})</span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {averageBetaVectors}
        <tr>
          <th scope="row">P Values</th>
          {results.pValues.map(toTableData)}
        </tr>
        <tr>
          <th scope="row">T Values</th>
          {results.tValues.map(toTableData)}
        </tr>
      </tbody>
    </table>
  );
}

ConsortiumResultTable.displayName = 'ConsortiumResultTable';

ConsortiumResultTable.propTypes = {
  covariates: PropTypes.arrayOf(PropTypes.string).isRequired,
  results: PropTypes.shape({
    averageBetaVectors: PropTypes.arrayOf(PropTypes.number),
    pValues: PropTypes.arrayOf(PropTypes.number).isRequired,
    tValues: PropTypes.arrayOf(PropTypes.number).isRequired,
  }).isRequired,
};
