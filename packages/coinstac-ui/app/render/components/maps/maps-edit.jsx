import React, { useState, useEffect } from 'react';
import { compose, graphql, withApollo } from 'react-apollo';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import MapsEditForm from './maps-edit-form';
import { saveDataMapping } from '../../state/ducks/maps';
import {
  UPDATE_CONSORTIUM_MAPPED_USERS_MUTATION,
} from '../../state/graphql/functions';

function MapsEdit({
  params, maps, pipelines, consortia, saveDataMapping, updateConsortiumMappedUsers
}) {
  const [isMapped, setIsMapped] = useState(false);
  const [consortium, setConsortium] = useState(null);
  const [pipeline, setPipeline] = useState(null);
  const [dataMap, setDataMap] = useState({});

  useEffect(() => {
    const consortium = consortia.find(c => c.id === params.consortiumId);
    setConsortium(consortium);

    const pipeline = pipelines.find(p => p.id === consortium.activePipelineId);
    setPipeline(pipeline);

    const consortiumDataMap = maps.find(
      m => m.consortiumId === consortium.id && m.pipelineId === consortium.activePipelineId
    );

    if (consortiumDataMap) {
      setIsMapped(true);
    }
  }, []);

  function onChange(fieldName, fieldData) {
    setDataMap({ ...dataMap, [fieldName]: fieldData });
  }

  function commitSaveDataMap() {
    setIsMapped(true);
    saveDataMapping(consortium.id, pipeline.id, dataMap);
    updateConsortiumMappedUsers(consortium.id, true);
  }

  return (
    <div>
      <div className="page-header">
        <Typography variant="h4">
          { `Map - ${consortium && consortium.name}` }
        </Typography>
      </div>
      {
        isMapped ? (
          <div>
            <div className="alert alert-success" role="alert">
              Mapping Complete!
            </div>
            <br />
            <Button
              variant="contained"
              color="primary"
              to="/dashboard/consortia"
              component={Link}
            >
              Back to Consortia
            </Button>
          </div>
        ) : (
          <MapsEditForm
            pipeline={pipeline}
            dataMap={dataMap}
            onChange={onChange}
            onSubmit={commitSaveDataMap}
          />
        )
      }
    </div>
  );
}

MapsEdit.propTypes = {
  params: PropTypes.object.isRequired,
  maps: PropTypes.array.isRequired,
  pipelines: PropTypes.array.isRequired,
  consortia: PropTypes.array.isRequired,
  saveDataMapping: PropTypes.func.isRequired,
  updateConsortiumMappedUsers: PropTypes.func.isRequired,
};

const mapStateToProps = ({ auth, maps }) => ({
  auth,
  maps: maps.consortiumDataMappings,
});

const ComponentWithData = compose(
  graphql(
    UPDATE_CONSORTIUM_MAPPED_USERS_MUTATION, {
      props: ({ mutate }) => ({
        updateConsortiumMappedUsers: (consortiumId, isMapped) => mutate({
          variables: { consortiumId, isMapped },
        }),
      }),
    }
  ),
  withApollo
)(MapsEdit);

export default connect(mapStateToProps,
  {
    saveDataMapping,
  })(ComponentWithData);
