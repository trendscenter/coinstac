import React from 'react';
import useDockerStatus from '../../hooks/useDockerStatus';
import ComputationsList from './computations-list';

const ComputationsListContainer = (props) => {
  const dockerStatus = useDockerStatus();

  return <ComputationsList {...props} dockerStatus={dockerStatus} />;
};

export default ComputationsListContainer;
