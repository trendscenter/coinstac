import React from 'react';
import { graphql } from 'react-apollo';
import PropTypes from 'prop-types';
import { FETCH_COMPUTATION_QUERY } from '../../state/graphql/functions';

const ComputationIO = ({ compIO }) => (
  <pre>
    {JSON.stringify(compIO, null, 2)}
  </pre>
);

ComputationIO.defaultProps = {
  compIO: null,
};

ComputationIO.propTypes = {
  compIO: PropTypes.object,
};

const ComputationIOWithData = graphql(FETCH_COMPUTATION_QUERY, {
  props: ({ data: { fetchComputation } }) => ({
    compIO: fetchComputation ? fetchComputation[0] : null,
  }),
  options: ({ computationId }) => ({ variables: { computationIds: [computationId] } }),
})(ComputationIO);

export default ComputationIOWithData;
