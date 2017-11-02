import React from 'react';
import { graphql } from 'react-apollo';
import PropTypes from 'prop-types';
import {
  Panel,
} from 'react-bootstrap';
import CollectionPipelineInput from './collection-pipeline-input';
import { FETCH_PIPELINE_QUERY } from '../../state/graphql/functions';

const CollectionPipeline = ({ activePipeline, collectionFiles }) => (
  <div>
    {activePipeline &&
      <div>
        <h3>{activePipeline.name}</h3>
        {activePipeline.steps.map(step => (
          <Panel
            header={<h3>{step.computations[0].meta.name}</h3>}
            key={step.id}
          >
            {Object.entries(step.ioMap).map(input => (
              <CollectionPipelineInput
                collectionFiles={collectionFiles}
                key={`${input[0]}-collection-input`}
                objKey={input[0]}
                objValue={input[1]}
              />
            ))}
          </Panel>
        ))}
      </div>
    }
  </div>
);

CollectionPipeline.defaultProps = {
  activePipeline: null,
  collectionFiles: [],
};

CollectionPipeline.propTypes = {
  activePipeline: PropTypes.object,
  collectionFiles: PropTypes.array,
};

const CollectionPipelineWithData = graphql(FETCH_PIPELINE_QUERY, {
  props: ({ data: { fetchPipeline } }) => ({
    activePipeline: fetchPipeline,
  }),
  options: ({ pipelineId }) => ({ variables: { pipelineId } }),
})(CollectionPipeline);

export default CollectionPipelineWithData;
