import React, { useState, useEffect } from 'react';
import { graphql, withApollo } from '@apollo/react-hoc';
import { flowRight as compose } from 'lodash';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Alert from '@material-ui/lab/Alert';
import Typography from '@material-ui/core/Typography';
import MapsEditForm from './maps-edit-form';
import { saveDataMapping } from '../../state/ducks/maps';
import {
  UPDATE_CONSORTIUM_MAPPED_USERS_MUTATION,
} from '../../state/graphql/functions';

function MapsEdit({
  params, maps, pipelines, consortia, saveDataMapping, updateConsortiumMappedUsers,
}) {
  const [saved, setSaved] = useState(false);
  const [consortium, setConsortium] = useState(null);
  const [pipeline, setPipeline] = useState(null);
  const [dataMap, setDataMap] = useState({});
  const [alertMsg, setAlertMsg] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const consortium = consortia.find(c => c.id === params.consortiumId);
    setConsortium(consortium);

    const pipeline = pipelines.find(p => p.id === consortium.activePipelineId);
    setPipeline(pipeline);

    const consortiumDataMap = maps.find(
      m => m.consortiumId === consortium.id && m.pipelineId === consortium.activePipelineId
    );

    if (consortiumDataMap) {
      setDataMap(consortiumDataMap.dataMap);
    }
  }, []);

  function onChange(fieldName, fieldData) {
    if (fieldData.required && !fieldData.value && fieldData.value !== 0) {
      setAlertMsg(`Please set value for ${fieldName}`);
      setError(true);
    } else {
      setDataMap({ ...dataMap, [fieldName]: fieldData });
      setSaved(false);
      setAlertMsg(false);
      setError(false);
    }
  }

  function commitSaveDataMap(e) {
    e.preventDefault();

    let unfulfilledArr = Object.entries(pipeline.steps[0].inputMap);

    unfulfilledArr = unfulfilledArr.filter(item => item[1].fulfilled === false);

    const dataMapArr = Object.entries(dataMap);

    const undef = [];

    unfulfilledArr.forEach((v, i) => {
      if (typeof dataMapArr[i] !== 'number' && !dataMapArr[i]) {
        undef.push(unfulfilledArr[i][0]);
      }
    });

    if (undef && typeof undef === 'object' && undef.length > 0) {
      undef.forEach((item) => {
        setAlertMsg(`Please set value for ${item}`);
        setError(true);
      });
    } else {
      saveDataMapping(consortium, pipeline, dataMap);
      updateConsortiumMappedUsers(consortium.id, true);
      setSaved(true);
      setAlertMsg(false);
      setError(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <Typography variant="h4">
          { `Map - ${consortium && consortium.name}` }
        </Typography>
        {alertMsg && (
          <Alert variant="outlined" severity="warning">
            {alertMsg}
          </Alert>
        )}
      </div>
      <MapsEditForm
        consortiumId={consortium && consortium.id}
        pipeline={pipeline}
        dataMap={dataMap}
        saved={saved}
        onChange={onChange}
        onSubmit={commitSaveDataMap}
        error={error}
      />
    </div>
  );
}

MapsEdit.propTypes = {
  consortia: PropTypes.array.isRequired,
  maps: PropTypes.array.isRequired,
  params: PropTypes.object.isRequired,
  pipelines: PropTypes.array.isRequired,
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
