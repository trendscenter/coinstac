import React, { PropTypes } from 'react';
import { Alert } from 'react-bootstrap';

import ConsortiumResult from './consortium-result';

export default function ConsortiumResults({ computations, remoteResults }) {
  const content = !remoteResults || !remoteResults.length ?
  (
    <Alert bsStyle="info">No results.</Alert>
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
  computations: PropTypes.array,
  remoteResults: PropTypes.array,
};

