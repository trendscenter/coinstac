import React, { PropTypes } from 'react';
import { Label, Panel } from 'react-bootstrap';
import scino from 'scino';

import ConsortiumResultTable from './consortium-result-table';

export default function ConsortiumResult({
  _id,
  activeComputationInputs,
  complete,
  computation,
  data,
  userErrors,
  usernames,
}) {
  let computationOutput;
  let dataOutput;
  let errors;
  let indicator;

  if (userErrors.length) {
    indicator = <Label bsStyle="danger">Error!</Label>;
  } else if (complete) {
    indicator = <Label bsStyle="success">Complete!</Label>;
  } else {
    indicator = <Label bsStyle="default">In Progress</Label>;
  }

  if (userErrors.length) {
    errors = (
      <div>
        <h3 className="h4">User errors:</h3>
        {userErrors.map((error, i) => {
          return <p key={i} className="bg-danger">{error}</p>;
        })}
      </div>
    );
  }

  if (computation) {
    computationOutput = (
      <ul className="list-unstyled">
        <li>
          <strong>Computation:</strong>
          {' '}
          {computation.meta.name}
          {' '}
          <span className="text-muted">(Version {computation.version})</span>
        </li>
        <li>
          <strong>Freesurfer ROI:</strong>
          {' '}
          {activeComputationInputs[0][0].join(', ')}
        </li>
        <li><strong>Users:</strong>{` ${usernames.join(', ')}`}</li>
      </ul>
    );
  }

  if (data) {
    /**
     * @todo This assumes covariates are placed at a specific location in
     * `activeComputationInputs`. Don't hard-code this!
     */
    const covariates = activeComputationInputs[0][1].map(x => x.name);

    dataOutput = (
      <div>
        <div>
          <h4>Global</h4>
          <dl className="consortium-result-list">
            <dt>R²</dt>
            <dd><samp>{scino(data.rSquaredGlobal, 5)}</samp></dd>
          </dl>
          <ConsortiumResultTable
            covariates={covariates}
            results={{
              averageBetaVectors: data.averageBetaVector,
              pValues: data.pValueGlobal,
              tValues: data.tValueGlobal,
            }}
          />
        </div>
        {data.tValueLocal.map((tValues, index) => (
          <div key={index}>
            <h4>Site {index + 1}</h4>
            <dl className="consortium-result-list">
              <dt>R²</dt>
              <dd><samp>{scino(data.rSquaredLocal[index], 5)}</samp></dd>
            </dl>
            <ConsortiumResultTable
              covariates={covariates}
              results={{
                pValues: data.pValueLocal[index],
                tValues,
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  const headingStyle = { marginTop: 0 };

  return (
    <Panel className="consortium-result">
      <h2 className="h3" style={headingStyle}>Computation #{_id} {indicator}</h2>
      {computationOutput}
      {errors}
      {dataOutput}
    </Panel>
  );
}

ConsortiumResult.displayName = 'ConsortiumResult';

ConsortiumResult.propTypes = {
  _id: PropTypes.string.isRequired,
  activeComputationInputs: PropTypes.array,
  complete: PropTypes.bool.isRequired,
  computation: PropTypes.shape({
    version: PropTypes.string.isRequired,
    meta: PropTypes.shape({
      name: PropTypes.string.isRequired,
    }),
  }).isRequired,
  data: PropTypes.object,
  pipelineState: PropTypes.object.isRequired,
  pluginState: PropTypes.object.isRequired,
  usernames: PropTypes.array.isRequired,
  userErrors: PropTypes.array.isRequired,
};
