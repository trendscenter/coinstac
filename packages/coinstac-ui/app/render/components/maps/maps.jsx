import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import MapsList from './maps-list';
import { notifyInfo, notifySuccess } from '../../state/ducks/notifyAndLog';

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
  runs: PropTypes.array.isRequired,
  routeParams: PropTypes.object.isRequired,
};

const mapStateToProps = ({ auth, collections: { associatedConsortia } }) => {
  return { auth, associatedConsortia };
};

export default connect(mapStateToProps, {
  notifyInfo,
  notifySuccess,
})(Maps);
