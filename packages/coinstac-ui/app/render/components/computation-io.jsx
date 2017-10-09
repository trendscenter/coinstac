import React from 'react';
import { graphql } from 'react-apollo';
import { fetchComputationDetailsFunc } from '../state/graphql/functions';

const ComputationIO = ({ compIO }) => (
  <pre>
    {JSON.stringify(compIO, null, 2)}
  </pre>
);

const ComputationIOWithData = graphql(fetchComputationDetailsFunc, {
  props: ({ data: { loading, fetchComputationDetails } }) => ({
    compIO: fetchComputationDetails,
  }),
  options: ({ computationName }) => ({ variables: { computationName } }),
})(ComputationIO);

export default ComputationIOWithData;
