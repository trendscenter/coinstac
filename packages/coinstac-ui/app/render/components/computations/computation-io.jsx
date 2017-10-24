import React from 'react';
import { graphql } from 'react-apollo';
import PropTypes from 'prop-types';
import { FETCH_COMPUTATION_QUERY } from '../../state/graphql/functions';
import { compIOProp } from '../../state/graphql/props';

const ComputationIO = ({ compIO }) => (
  <pre>
    {JSON.stringify(compIO, null, 2)}
  </pre>
);

ComputationIO.propTypes = {
  compIO: PropTypes.object.isRequired,
};

const ComputationIOWithData = graphql(FETCH_COMPUTATION_QUERY, compIOProp)(ComputationIO);

export default ComputationIOWithData;
