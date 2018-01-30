import React, { Component } from 'react';
import { graphql } from 'react-apollo';
import PropTypes from 'prop-types';
import {
  Panel,
} from 'react-bootstrap';
import CollectionPipelineInput from './collection-pipeline-input';
import { FETCH_PIPELINE_QUERY, PIPELINE_CHANGED_SUBSCRIPTION } from '../../state/graphql/functions';
import {
  getSelectAndSubProp,
} from '../../state/graphql/props';

class CollectionPipeline extends Component {
  componentWillReceiveProps(nextProps) {
    if (nextProps.activePipeline &&
      nextProps.activePipeline.steps &&
      this.props.pipelineSteps.length === 0) {
      this.props.setPipelineSteps(nextProps.activePipeline.steps);
    }
  }

  render() {
    const {
      activePipeline,
      associatedConsortia,
      collection,
      consortiumId,
      consortiumName,
      updateConsortiumCovars,
    } = this.props;

    return (
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
                    associatedConsortia={associatedConsortia}
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
  }
}

CollectionPipeline.defaultProps = {
  activePipeline: null,
};

CollectionPipeline.propTypes = {
  associatedConsortia: PropTypes.array.isRequired,
  activePipeline: PropTypes.object,
  collection: PropTypes.object.isRequired,
  consortiumId: PropTypes.string.isRequired,
  consortiumName: PropTypes.string.isRequired,
  pipelineSteps: PropTypes.array.isRequired,
  setPipelineSteps: PropTypes.func.isRequired,
  updateConsortiumCovars: PropTypes.func.isRequired,
};

const CollectionPipelineWithData = graphql(FETCH_PIPELINE_QUERY, getSelectAndSubProp(
    'activePipeline',
    PIPELINE_CHANGED_SUBSCRIPTION,
    'pipelineId',
    'subscribeToPipelines',
    'pipelineChanged',
    'fetchPipeline'
  ))(CollectionPipeline);

export default CollectionPipelineWithData;
