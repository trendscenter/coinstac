import React, { PropTypes } from 'react';

export default function ConsortiumResultMeta({
  computation,
  computationInputs,
  step,
  usernames,
}) {
  let covariates;
  let iterations;
  let lambda;

  // TODO: Don't hard-code for inputs
  if (computation.name === 'decentralized-single-shot-ridge-regression') {
    covariates = computationInputs[0][2].map(x => x.name);
    lambda = computationInputs[0][1];
  } else {
    const maxIterations = computationInputs[0][1];

    /**
     * @todo Don't artificially ceiling current step! Determine way for
     * computations to signal actual computation step in the system.
     */
    const currentIteration = step > maxIterations ? maxIterations : step;

    covariates = computationInputs[0][3].map(x => x.name);
    iterations = (
      <li>
        <strong>Iterations:</strong>
        {` ${currentIteration}`}
        <span className="text-muted">/{maxIterations}</span>
      </li>
    );
    lambda = computationInputs[0][2];
  }

  return (
    <ul className="list-unstyled">
      <li>
        <strong>Computation:</strong>
        {' '}
        {computation.meta.name}
        {' '}
        <span className="text-muted">(Version {computation.version})</span>
      </li>
      {iterations}
      <li><strong>Covariates:</strong>{` ${covariates.join(', ')}`}</li>
      <li>
        <strong>Freesurfer ROI:</strong>
        {' '}
        {computationInputs[0][0].join(', ')}
      </li>
      <li><strong>Lambda:</strong>{' '}<samp>{lambda}</samp></li>
      <li><strong>Users:</strong>{` ${usernames.join(', ')}`}</li>
    </ul>
  );
}

ConsortiumResultMeta.displayName = 'ConsortiumResultMeta';

ConsortiumResultMeta.propTypes = {
  computation: PropTypes.shape({
    meta: PropTypes.shape({
      name: PropTypes.string.isRequired,
    }).isRequired,
    version: PropTypes.string.isRequired,
  }).isRequired,
  computationInputs: PropTypes.arrayOf(PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.string),
      PropTypes.arrayOf(PropTypes.object),
      PropTypes.number,
    ])
  )).isRequired,
  step: PropTypes.number.isRequired,
  usernames: PropTypes.arrayOf(PropTypes.string).isRequired,
};
