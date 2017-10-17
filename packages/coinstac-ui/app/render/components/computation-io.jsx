import React from 'react';
import { graphql } from 'react-apollo';
import { FETCH_COMPUTATION_QUERY } from '../state/graphql/functions';

const ComputationIO = ({ compIO }) => (
  <pre>
    {JSON.stringify(compIO, null, 2)}
  </pre>
);

const ComputationIOWithData = graphql(FETCH_COMPUTATION_QUERY, {
  props: ({ data: { loading, fetchComputation } }) => ({
    compIO: fetchComputation,
  }),
  options: ({ computationName }) => ({ variables: { computationName } }),
})(ComputationIO);

export default ComputationIOWithData;
