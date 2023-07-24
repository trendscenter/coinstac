/* eslint-disable react/no-array-index-key */
import React from 'react';
import PropTypes from 'prop-types';
import AddIcon from '@material-ui/icons/Add';
import Button from '@material-ui/core/Button';
import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableBody from '@material-ui/core/TableBody';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import { withStyles } from '@material-ui/core/styles';
import PipelineStepInputFreesurferTableRow from './pipeline-step-input-freesurfer-table-row';

const styles = theme => ({
  addObjButton: {
    marginBottom: theme.spacing(1),
    marginLeft: theme.spacing(1),
  },
});

function PipelineStepInputFreesurfer(props) {
  const {
    objKey, objParams, owner, addClientProp, getNewObj, possibleInputs, step,
    updateStep, classes,
  } = props;

  const objInputMap = step.inputMap[objKey];

  return (
    <div style={{ paddingLeft: 10 }}>
      <Button
        variant="contained"
        color="primary"
        disabled={!owner}
        onClick={addClientProp}
        className={classes.addObjButton}
      >
        <AddIcon />
        {`Add ${objParams.label}`}
      </Button>
      {
        objInputMap && objInputMap.value && (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Data Type</TableCell>
                <TableCell>{objParams.items.includes('FreeSurfer') ? 'Interest': ''}</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {
                objInputMap.value.map((obj, index) => (
                  <PipelineStepInputFreesurferTableRow
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
            </TableBody>
          </Table>
        )
      }
    </div>
  );
}

PipelineStepInputFreesurfer.defaultProps = {
  possibleInputs: null,
};

PipelineStepInputFreesurfer.propTypes = {
  objKey: PropTypes.string.isRequired,
  objParams: PropTypes.object.isRequired,
  owner: PropTypes.bool.isRequired,
  step: PropTypes.object.isRequired,
  getNewObj: PropTypes.func.isRequired,
  updateStep: PropTypes.func.isRequired,
  addClientProp: PropTypes.func.isRequired,
  possibleInputs: PropTypes.array,
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(PipelineStepInputFreesurfer);
