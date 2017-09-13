import React from 'react';
import { graphql } from 'react-apollo';
import { fetchComputationLocalIO } from '../state/graphql-queries';

const ComputationIO = ({ compIO }) => (
  <pre>
    {JSON.stringify(compIO, null, 2)}
  </pre>
);

const ComputationIOWithData = graphql(fetchComputationLocalIO, {
  props: ({ data: { fetchComputationMetadataByName } }) => ({
    compIO: fetchComputationMetadataByName,
  }),
  options: ({ computationName }) => ({ variables: { computationName } }),
})(ComputationIO);

export default ComputationIOWithData;
