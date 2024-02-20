import React from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import MapsList from './maps-list';

function Maps({
  consortia,
  pipelines,
  runs,
  routeParams,
}) {
  const auth = useSelector(state => state.auth);

  return (
    <MapsList
      auth={auth}
      consortia={consortia}
      pipelines={pipelines}
      runs={runs}
      mapId={routeParams.mapId}
    />
  );
}

Maps.propTypes = {
  consortia: PropTypes.array.isRequired,
  pipelines: PropTypes.array.isRequired,
  routeParams: PropTypes.object.isRequired,
  runs: PropTypes.array.isRequired,
};

export default Maps;
