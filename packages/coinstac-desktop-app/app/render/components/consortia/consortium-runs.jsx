import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import RunsList from '../common/runs-list';
import { isUserInGroup } from '../../utils/helpers';

const ConsortiumRuns = ({ auth, runs, consortium }) => {
  const filteredRuns = useMemo(() => {
    if (!runs) return [];

    return runs.filter(run => run.consortiumId === consortium.id
      && (isUserInGroup(auth.user.id, run.observers)
        || (run.sharedUsers && isUserInGroup(auth.user.id, run.sharedUsers))
      ));
  }, [runs]);

  return (
    <RunsList
      runs={filteredRuns}
      consortia={[consortium]}
      noRunMessage="No runs found"
    />
  );
};

ConsortiumRuns.propTypes = {
  auth: PropTypes.object.isRequired,
  consortium: PropTypes.object.isRequired,
  runs: PropTypes.array,
};

ConsortiumRuns.defaultProps = {
  runs: null,
};

const mapStateToProps = ({ auth }) => ({
  auth,
});

export default connect(mapStateToProps)(ConsortiumRuns);
