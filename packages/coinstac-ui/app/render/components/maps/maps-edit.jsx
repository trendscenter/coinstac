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
import MapsExcludedSubjects from './fields/maps-excluded-subjects';

function MapsEdit({
  params, maps, pipelines, consortia, saveDataMapping, updateConsortiumMappedUsers,
}) {
  const [saved, setSaved] = useState(false);
  const [consortium, setConsortium] = useState(null);
  const [pipeline, setPipeline] = useState(null);
  const [dataMap, setDataMap] = useState({});
  const [alertMsg, setAlertMsg] = useState(null);
  const [error, setError] = useState(false);
  const [excludedSubjects, setExcludedSubjects] = useState(null);

  useEffect(() => {
    const consortium = consortia.find(c => c.id === params.consortiumId);
    setConsortium(consortium);

    const pipeline = pipelines.find(p => p.id === consortium.activePipelineId);
    setPipeline(pipeline);

    const consortiumDataMap = maps.find(
      m => m.consortiumId === consortium.id && m.pipelineId === consortium.activePipelineId
    );


    if (consortiumDataMap) {
      const excluded = consortiumDataMap.map.reduce((prev, curr) => {
        return prev.concat(curr.excludedSubjectsArray);
      }, []);
      setExcludedSubjects(excluded);
      setDataMap(consortiumDataMap.dataMap);
    }
  }, [maps]);

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

  async function commitSaveDataMap(e) {
    e.preventDefault();

    const unfulfilledArr = Object.keys(pipeline.steps[0].inputMap).reduce((memo, item) => {
      if (pipeline.steps[0].inputMap[item]?.fulfilled === false) {
        memo[item] = pipeline.steps[0].inputMap[item];
      }
      return memo;
    }, {});

    const undef = [];

    Object.keys(unfulfilledArr).forEach((key) => {
      if (!dataMap[key]) undef.push(key);
    });


    if (undef.length > 0) {
      undef.forEach((item) => {
        setAlertMsg(`Please set value for ${item}`);
        setError(true);
      });
    } else {
      try {
        await saveDataMapping(consortium, pipeline, dataMap);
        updateConsortiumMappedUsers(consortium.id, true);
        setSaved(true);
        setAlertMsg(false);
        setError(false);
      } catch (error) {
        setSaved(false);
        setAlertMsg(`${error}`);
        setError(true);
      }
    }
  }

  return (
    <div>
      <div className="page-header">
        <Typography variant="h4">
          {`Map - ${consortium && consortium.name}`}
        </Typography>
        {alertMsg && (
          <Alert variant="outlined" severity="warning">
            {alertMsg}
          </Alert>
        )}
      </div>
      <MapsExcludedSubjects excludedSubjects={excludedSubjects} />
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
