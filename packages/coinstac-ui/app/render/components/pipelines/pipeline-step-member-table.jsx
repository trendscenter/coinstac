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

  return (
    <Table>
      {
        step.inputMap[objKey]
        && 'ownerMappings' in step.inputMap[objKey]
        && step.inputMap[objKey].ownerMappings.length > 0
        && (
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
        )
      }
      {
        step.inputMap[objKey]
        && 'ownerMappings' in step.inputMap[objKey]
        && step.inputMap[objKey].ownerMappings.map((obj, index) => (
          <PipelineOwnerMappings
            key={`${objKey}-${index}`}
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
  getNewObj: PropTypes.func.isRequired,
  objKey: PropTypes.string.isRequired,
  objParams: PropTypes.object.isRequired,
  owner: PropTypes.bool.isRequired,
  possibleInputs: PropTypes.array.isRequired,
  step: PropTypes.object.isRequired,
  updateStep: PropTypes.func.isRequired,
};

export default PipelineStepMemberTable;
