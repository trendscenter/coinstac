import { graphql, withApollo } from '@apollo/react-hoc';
import Typography from '@material-ui/core/Typography';
import Alert from '@material-ui/lab/Alert';
import { flowRight as compose } from 'lodash';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { saveDataMapping } from '../../state/ducks/maps';
import {
  UPDATE_CONSORTIUM_MAPPED_USERS_MUTATION,
} from '../../state/graphql/functions';
import MapsExcludedSubjects from './fields/maps-excluded-subjects';
import MapsEditForm from './maps-edit-form';

function MapsEdit({
  params, pipelines, consortia, updateConsortiumMappedUsers,
}) {
  const maps = useSelector(state => state.maps.consortiumDataMappings);
  const dispatch = useDispatch();

  const [saved, setSaved] = useState(false);
  const [consortium, setConsortium] = useState(null);
  const [pipeline, setPipeline] = useState(null);
  const [dataMap, setDataMap] = useState({});
  const [alertMsg, setAlertMsg] = useState(null);
  const [excludedSubjects, setExcludedSubjects] = useState(null);

  useEffect(() => {
    const consortium = consortia.find(c => c.id === params.consortiumId);
    setConsortium(consortium);

    const pipeline = pipelines.find(p => p.id === consortium.activePipelineId);
    setPipeline(pipeline);

    const consortiumDataMap = maps.find(
      m => m.consortiumId === consortium.id && m.pipelineId === consortium.activePipelineId,
    );

    if (consortiumDataMap) {
      const excluded = consortiumDataMap.map
        .reduce((prev, curr) => prev.concat(curr.excludedSubjectsArray), []);
      setExcludedSubjects(excluded.filter(Boolean));
      setDataMap(consortiumDataMap.dataMap);
    }
  }, [maps]);

  function onChange(fieldName, fieldData) {
    if (fieldData.required && !fieldData.value && fieldData.value !== 0) {
      setAlertMsg(`Please set value for ${fieldName}`);
    } else {
      setDataMap({ ...dataMap, [fieldName]: fieldData });
      setSaved(false);
      setAlertMsg(null);
    }
  }

  async function commitSaveDataMap(e) {
    e.preventDefault();

    const unfulfilledArr = Object.keys(pipeline.steps[0].inputMap).reduce((acc, item) => {
      if (pipeline.steps[0].inputMap[item]?.fulfilled === false) {
        acc[item] = pipeline.steps[0].inputMap[item];
      }
      return acc;
    }, {});

    const undef = [];

    Object.keys(unfulfilledArr).forEach((key) => {
      if (dataMap[key]
        && dataMap[key].fieldType === 'csv'
        && unfulfilledArr[key].value.length !== Object.keys(dataMap[key].maps).length
      ) {
        undef.push(`Missing fields for ${key}`);
      } else if (!dataMap[key]) {
        undef.push(`Please set value for ${key}`);
      }
    });

    if (undef.length > 0) {
      setAlertMsg(undef[0]);
    } else {
      try {
        await dispatch(saveDataMapping(consortium, pipeline, dataMap));
        updateConsortiumMappedUsers(consortium.id, true);
        setSaved(true);
        setAlertMsg(null);
      } catch (error) {
        setSaved(false);
        setAlertMsg(`${error}`);
      }
    }
  }

  return (
    <div>
      <div className="page-header">
        <Typography variant="h4">
          {`Map - ${consortium && consortium.name}`}
        </Typography>
      </div>
      <MapsExcludedSubjects excludedSubjects={excludedSubjects} />
      {alertMsg && (
        <Alert variant="outlined" severity="warning">
          {alertMsg}
        </Alert>
      )}
      <MapsEditForm
        consortiumId={consortium && consortium.id}
        pipeline={pipeline}
        dataMap={dataMap}
        saved={saved}
        onChange={onChange}
        onSubmit={commitSaveDataMap}
        error={Boolean(alertMsg)}
      />

    </div>
  );
}

MapsEdit.propTypes = {
  consortia: PropTypes.array.isRequired,
  params: PropTypes.object.isRequired,
  pipelines: PropTypes.array.isRequired,
  updateConsortiumMappedUsers: PropTypes.func.isRequired,
};

const ComponentWithData = compose(
  graphql(
    UPDATE_CONSORTIUM_MAPPED_USERS_MUTATION,
    {
      props: ({ mutate }) => ({
        updateConsortiumMappedUsers: (consortiumId, isMapped) => mutate({
          variables: { consortiumId, isMapped },
        }),
      }),
    },
  ),
  withApollo,
)(MapsEdit);

export default ComponentWithData;
