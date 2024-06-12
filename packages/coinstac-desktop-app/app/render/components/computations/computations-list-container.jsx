import React from 'react';

import useContainerStatus from '../../hooks/useContainerStatus';
import ComputationsList from './computations-list';

const ComputationsListContainer = (props) => {
  const containerStatus = useContainerStatus();

  return <ComputationsList {...props} containerStatus={containerStatus} />;
};

export default ComputationsListContainer;
