import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Typography from '@material-ui/core/Typography';
import RunItem from './run-item';

const RunsList = ({
  runs,
  consortia,
  noRunMessage,
  stopPipeline,
  suspendPipeline,
  resumePipeline,
}) => {
  return (
    <div>
      {runs.map((run) => {
        const consortium = consortia.find(con => con.id === run.consortiumId);

        if (!consortium) {
          return null;
        }

        return (
          <RunItem
            key={`${run.id}-list-item`}
            runObject={run}
            consortium={consortium}
            stopPipeline={stopPipeline(run.id)}
            suspendPipeline={suspendPipeline(run.id)}
            resumePipeline={resumePipeline(run)}
          />
        );
      })}
      {!runs.length && noRunMessage && (
        <Typography variant="body2">
          { noRunMessage }
        </Typography>
      )}
    </div>
  );
};

RunsList.defaultProps = {
  stopPipeline: () => {},
  suspendPipeline: () => {},
  resumePipeline: () => {},
};

RunsList.propTypes = {
  runs: PropTypes.array.isRequired,
  consortia: PropTypes.array.isRequired,
  noRunMessage: PropTypes.string.isRequired,
  stopPipeline: PropTypes.func,
  suspendPipeline: PropTypes.func,
  resumePipeline: PropTypes.func,
};

const mapStateToProps = ({ auth }) => ({
  auth,
});

export default connect(mapStateToProps)(RunsList);
