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
      const consortium = consortia.find(con => con.id === run.consortiumId);

      if (!consortium) {
        return null;
      }

      return (
        <RunItem
          key={`${run.id}-list-item`}
          runObject={run}
          consortium={consortium}
          stopPipeline={stopPipeline(run.pipelineSnapshot.id, run.id)}
        />
      );
    })}
  </div>
);

RunsList.defaultProps = {
  stopPipeline: () => { },
};

RunsList.propTypes = {
  consortia: PropTypes.array.isRequired,
  runs: PropTypes.array.isRequired,
  stopPipeline: PropTypes.func,
};

export default RunsList;
