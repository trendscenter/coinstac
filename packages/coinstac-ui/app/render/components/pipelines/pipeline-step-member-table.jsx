import React from 'react';
import PropTypes from 'prop-types';
import Table from '@material-ui/core/Table';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import PipelineOwnerMappings from './pipeline-owner-mappings';

function PipelineStepMemberTable(props) {
  const {
    getNewObj,
    objKey,
    objParams,
    owner,
    possibleInputs,
    step,
    updateStep,
  } = props;

  const objInputMap = step.inputMap[objKey];

  if (!objInputMap || !('ownerMappings' in objInputMap) || objInputMap.ownerMappings.length === 0) {
    return null;
  }


  return (
    <Table>
      <TableHead>
        {
          objKey === 'covariates'
          && (
            <TableRow>
              <TableCell>Data Type</TableCell>
              <TableCell>Source</TableCell>
              <TableCell>Name</TableCell>
              <TableCell />
            </TableRow>
          )
        }
        {
          objKey === 'data'
          && (
            <TableRow>
              <TableCell>Data Type</TableCell>
              <TableCell>Interest</TableCell>
              <TableCell />
            </TableRow>
          )
        }
      </TableHead>
      {
        objInputMap.ownerMappings.map((obj, index) => (
          <PipelineOwnerMappings
            key={`${objKey}-${index}`} // eslint-disable-line react/no-array-index-key
            index={index}
            obj={obj}
            objKey={objKey}
            owner={owner}
            possibleInputs={possibleInputs}
            objParams={objParams}
            getNewObj={getNewObj}
            updateStep={updateStep}
            step={step}
          />
        ))
      }
    </Table>
  );
}

PipelineStepMemberTable.propTypes = {
  objKey: PropTypes.string.isRequired,
  objParams: PropTypes.object.isRequired,
  owner: PropTypes.bool.isRequired,
  possibleInputs: PropTypes.array.isRequired,
  step: PropTypes.object.isRequired,
  getNewObj: PropTypes.func.isRequired,
  updateStep: PropTypes.func.isRequired,
};

export default PipelineStepMemberTable;
