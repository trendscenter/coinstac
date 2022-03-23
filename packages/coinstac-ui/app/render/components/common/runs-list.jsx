import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Typography from '@material-ui/core/Typography';
import RunItem from './run-item';
import { isUserInGroup } from '../../utils/helpers';

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
  suspendPipeline,
  resumePipeline,
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
          && (
            isUserInGroup(auth.user.id, consortium.members)
            || isUserInGroup(auth.user.id, consortium.owners)
            || (run.sharedUsers && isUserInGroup(auth.user.id, run.sharedUsers))
          )
        ) {
          return (
            <RunItem
              key={`${run.id}-list-item`}
              runObject={run}
              consortiumName={
                consortium && consortium.name ? consortium.name : ''
              }
              stopPipeline={stopPipeline(run.id)}
              suspendPipeline={suspendPipeline(run.id)}
              resumePipeline={resumePipeline(run)}
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
                    {' '}
                    {limitToComplete ? 'results' : 'runs'}
                    {' '}
                    found
                  </span>
                )
                : (
                  <span>
                    No activity in the last
                    {' '}
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
  suspendPipeline: () => {},
  resumePipeline: () => {},
};

RunsList.propTypes = {
  auth: PropTypes.object.isRequired,
  consortia: PropTypes.array.isRequired,
  hoursSinceActive: PropTypes.number.isRequired,
  limitToComplete: PropTypes.bool.isRequired,
  runs: PropTypes.array.isRequired,
  stopPipeline: PropTypes.func,
  suspendPipeline: PropTypes.func,
  resumePipeline: PropTypes.func,
};

const mapStateToProps = ({ auth }) => ({
  auth,
});

export default connect(mapStateToProps)(RunsList);
