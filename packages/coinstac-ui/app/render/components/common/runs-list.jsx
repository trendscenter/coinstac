import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Typography from '@material-ui/core/Typography';
import RunItem from './run-item';

function getActiveTime(hoursSinceActive) {
  return Date.now() - (hoursSinceActive * 60 * 60 * 1000);
}

const RunsList = ({
  auth,
  consortia,
  limitToComplete,
  hoursSinceActive,
  runs,
  stopPipeline,
}) => {
  let runNoResultsCount = 0;

  return (
    <div>
      {runs && runs.map((run) => {
        const activeTime = hoursSinceActive === 0
          ? hoursSinceActive : getActiveTime(hoursSinceActive);
        const consortium = consortia.filter(con => con.id === run.consortiumId)[0];

        if ((!limitToComplete || (limitToComplete && (run.status === 'complete' || run.status === 'error')))
          && (run.startDate > activeTime || run.endDate > activeTime)
          && consortium
          && (consortium.owners.indexOf(auth.user.id) > -1
            || consortium.members.indexOf(auth.user.id) > -1
            || (run.sharedUsers && run.sharedUsers.indexOf(auth.user.id) > -1)
          )
        ) {
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

        runNoResultsCount += 1;
        return null;
      })}
      {
        (!runs || !runs.length || runNoResultsCount === runs.length)
        && (
          <Typography variant="body2">
            {
              hoursSinceActive === 0
                ? (
                  <span>
No
                    {limitToComplete ? 'results' : 'runs'}
                    {' '}
found
                  </span>
                )
                : (
                  <span>
No activity in the last
                    <span className="bold">{hoursSinceActive}</span>
                    {' '}
hours.
                  </span>
                )
            }
          </Typography>
        )
      }
    </div>
  );
};

RunsList.defaultProps = {
  stopPipeline: () => {},
};

RunsList.propTypes = {
  auth: PropTypes.object.isRequired,
  consortia: PropTypes.array.isRequired,
  hoursSinceActive: PropTypes.number.isRequired,
  limitToComplete: PropTypes.bool.isRequired,
  runs: PropTypes.array.isRequired,
  stopPipeline: PropTypes.func,
};

const mapStateToProps = ({ auth }) => ({
  auth,
});

export default connect(mapStateToProps)(RunsList);
