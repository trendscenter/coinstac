import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import MapsEditForm from './maps-edit-form';
import { saveDataMapping } from '../../state/ducks/maps';

function MapsEdit({
  params, maps, pipelines, consortia,
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
            onChange={(fieldName, fieldData) => setDataMap({ ...dataMap, [fieldName]: fieldData })}
          />
        )
      }
    </div>
  );
}

const mapStateToProps = ({ auth, maps }) => ({
  auth,
  maps: maps.consortiumDataMappings,
});

export default connect(mapStateToProps,
  {
    saveDataMapping,
  })(MapsEdit);
