import React from 'react';
import PropTypes from 'prop-types';
import RunItem from '../common/run-item';

const RunsList = ({
  consortia,
  runs,
  stopPipeline,
}) => (
  <div>
    {runs && runs.map((run) => {
      const consortium = consortia.filter(con => con.id === run.consortiumId)[0];

      if (consortium) {
        return (
          <RunItem
            key={`${run.id}-list-item`}
            runObject={run}
            consortiumName={
              consortium && consortium.name ? consortium.name : ''
            }
            stopPipeline={stopPipeline(run.pipelineSnapshot.id, run.id)}
          />
        );
      }

      return null;
    })}
  </div>
);

RunsList.defaultProps = {
  stopPipeline: () => {},
};

RunsList.propTypes = {
  consortia: PropTypes.array.isRequired,
  runs: PropTypes.array.isRequired,
  stopPipeline: PropTypes.func,
};

export default RunsList;
