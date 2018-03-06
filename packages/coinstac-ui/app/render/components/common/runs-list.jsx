import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Alert } from 'react-bootstrap';
import RunItem from './run-item';

function getActiveTime(hoursSinceActive) {
  return Date.now() - (hoursSinceActive * 60 * 60 * 1000);
}

const RunsList = ({ consortia, limitToComplete, hoursSinceActive, runs }) => {
  let runNoResultsCount = 0;

  return (
    <div>
      {runs && runs.map((run) => {
        const activeTime = hoursSinceActive === 0
          ? hoursSinceActive : getActiveTime(hoursSinceActive);
        if ((!limitToComplete || (limitToComplete && run.status === 'complete'))
          && (run.startDate > activeTime || run.endDate > activeTime)) {
          const consortium = consortia.filter(con => con.id === run.consortiumId)[0];
          return (
            <RunItem
              key={`${run.id}-list-item`}
              runObject={run}
              consortiumName={
                consortium && consortium.name ? consortium.name : ''
              }
            />
          );
        }

        runNoResultsCount += 1;
        return null;
      })}
      {(!runs || !runs.length || runNoResultsCount === runs.length) &&
        <Alert bsStyle="info">
          {hoursSinceActive === 0 && (<span>No {limitToComplete ? 'results' : 'runs'} found</span>)}
          {hoursSinceActive > 0 &&
            (
              <span>
                No activity in the last <span className="bold">{hoursSinceActive}</span> hours.
              </span>
            )
          }
        </Alert>
      }
    </div>
  );
};

RunsList.propTypes = {
  hoursSinceActive: PropTypes.number.isRequired,
  limitToComplete: PropTypes.bool.isRequired,
  runs: PropTypes.array.isRequired,
  consortia: PropTypes.array.isRequired,
};

const mapStateToProps = ({ auth }) => {
  return { auth };
};

export default connect(mapStateToProps)(RunsList);
