import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import MapsList from './maps-list';

function Maps({
  auth, consortia, pipelines, runs, routeParams,
}) {
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
  auth: PropTypes.object.isRequired,
  consortia: PropTypes.array.isRequired,
  pipelines: PropTypes.array.isRequired,
  routeParams: PropTypes.object.isRequired,
  runs: PropTypes.array.isRequired,
};

const mapStateToProps = ({ auth }) => ({
  auth,
});

export default connect(mapStateToProps)(Maps);
