import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { isUserInGroup } from '../../utils/helpers';
import RunsList from '../common/runs-list';

const ConsortiumRuns = ({ runs, consortium }) => {
  const auth = useSelector(state => state.auth);

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
  consortium: PropTypes.object.isRequired,
  runs: PropTypes.array,
};

ConsortiumRuns.defaultProps = {
  runs: null,
};

export default ConsortiumRuns;
