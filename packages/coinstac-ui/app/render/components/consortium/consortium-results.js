import React, { PropTypes } from 'react';
import { Alert } from 'react-bootstrap';

import ConsortiumResult from './consortium-result';

export default function ConsortiumResults(props) {
  const { activeComputationInputs, computations, remoteResults } = props;
  const content = !remoteResults || !remoteResults.length ?
  (
    <Alert bsStyle="info">
      Pending consortium analysis kickoff. Get started and group data will
      show here.
    </Alert>
  ) :
  (
    <ul className="list-unstyled">
      {remoteResults.map((result, index) => {
        const computation = computations.find(c => {
          return c._id === result.computationId;
        });

        return (
          <li key={index}>
            <ConsortiumResult
              activeComputationInputs={activeComputationInputs}
              computation={computation}
              {...result}
            />
          </li>
        );
      })}
    </ul>
  );

  return (
    <section>
      <h2 className="h4">Results:</h2>
      {content}
    </section>
  );
}

ConsortiumResults.displayName = 'ConsortiumResults';

ConsortiumResults.propTypes = {
  activeComputationInputs: PropTypes.array,
  computations: PropTypes.array,
  remoteResults: PropTypes.array,
};

