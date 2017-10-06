import React from 'react';
import { graphql } from 'react-apollo';
import { fetchComputationDetailsFunc } from '../../state/graphql-queries';

const ComputationIO = ({ compIO }) => (
  <pre>
    {JSON.stringify(compIO, null, 2)}
  </pre>
);

const ComputationIOWithData = graphql(fetchComputationDetailsFunc, {
  props: ({ data: { fetchComputationDetails } }) => ({
    compIO: fetchComputationDetails ? fetchComputationDetails[0] : null,
  }),
  options: ({ computationId }) => ({ variables: { computationIds: [computationId] } }),
})(ComputationIO);

export default ComputationIOWithData;
