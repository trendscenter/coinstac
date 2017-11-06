import React from 'react';
import { graphql } from 'react-apollo';
import PropTypes from 'prop-types';
import {
  Panel,
} from 'react-bootstrap';
import CollectionPipelineInput from './collection-pipeline-input';
import { FETCH_PIPELINE_QUERY } from '../../state/graphql/functions';

const CollectionPipeline = ({
  activePipeline,
  collection,
  consortiumId,
  consortiumName,
  updateConsortiumCovars,
}) => (
  <div>
    {activePipeline &&
      <div>
        <h3>{consortiumName}: {activePipeline.name}</h3>
        {activePipeline.steps.map((step, stepIndex) => (
          <Panel
            header={<h3>{step.computations[0].meta.name}</h3>}
            key={step.id}
          >
            {Object.entries(step.ioMap).map(input => (
              <CollectionPipelineInput
                collection={collection}
                consortiumId={consortiumId}
                key={`${input[0]}-collection-input`}
                objKey={input[0]}
                objValue={input[1]}
                stepIndex={stepIndex}
                updateConsortiumCovars={updateConsortiumCovars}
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
};

CollectionPipeline.propTypes = {
  activePipeline: PropTypes.object,
  collection: PropTypes.object.isRequired,
  consortiumId: PropTypes.string.isRequired,
  consortiumName: PropTypes.string.isRequired,
  updateConsortiumCovars: PropTypes.func.isRequired,
};

const CollectionPipelineWithData = graphql(FETCH_PIPELINE_QUERY, {
  props: ({ data: { fetchPipeline } }) => ({
    activePipeline: fetchPipeline,
  }),
  options: ({ pipelineId }) => ({ variables: { pipelineId } }),
})(CollectionPipeline);

export default CollectionPipelineWithData;
