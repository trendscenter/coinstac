import React, { PropTypes } from 'react';
import { Label, Panel } from 'react-bootstrap';
import scino from 'scino';

import ConsortiumResultMeta from './consortium-result-meta';
import ConsortiumResultTable from './consortium-result-table';

export default function ConsortiumResult({
  _id,
  computationInputs,
  complete,
  computation,
  data,
  pluginState,
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
      <ConsortiumResultMeta
        computation={computation}
        computationInputs={computationInputs}
        step={pluginState['group-step'].step}
        usernames={usernames}
      />
    );
  }

  if (data) {
    /**
     * @todo This assumes covariates are placed at a specific location in
     * `computationInputs`. Don't hard-code this!
     */
    const covariates =
      computation.name === 'decentralized-single-shot-ridge-regression' ?
      computationInputs[0][1].map(x => x.name) :
      computationInputs[0][2].map(x => x.name);

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
  complete: PropTypes.bool.isRequired,
  computation: PropTypes.shape({
    meta: PropTypes.shape({
      name: PropTypes.string.isRequired,
    }),
    version: PropTypes.string.isRequired,
  }).isRequired,
  computationInputs: PropTypes.arrayOf(PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.string),
      PropTypes.arrayOf(PropTypes.object),
      PropTypes.number,
    ])
  )).isRequired,
  data: PropTypes.shape({
    averageBetaVector: PropTypes.arrayOf(PropTypes.number),
    pValueGlobal: PropTypes.arrayOf(PropTypes.number).isRequired,
    pValueLocal: PropTypes.arrayOf(PropTypes.array).isRequired,
    rSquaredGlobal: PropTypes.number.isRequired,
    rSquaredLocal: PropTypes.arrayOf(PropTypes.number).isRequired,
    tValueGlobal: PropTypes.arrayOf(PropTypes.number).isRequired,
    tValueLocal: PropTypes.arrayOf(PropTypes.array).isRequired,
  }),
  pipelineState: PropTypes.object.isRequired,
  pluginState: PropTypes.object.isRequired,
  usernames: PropTypes.array.isRequired,
  userErrors: PropTypes.array.isRequired,
};
