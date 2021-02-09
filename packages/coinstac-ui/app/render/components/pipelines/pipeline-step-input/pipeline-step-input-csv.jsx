import React from 'react';
import PropTypes from 'prop-types';
import AddIcon from '@material-ui/icons/Add';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button,
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import PipelineStepInputCsvTableRow from './pipeline-step-input-csv-table-row';

const styles = theme => ({
  addObjButton: {
    marginBottom: theme.spacing(1),
    marginLeft: theme.spacing(1),
  },
});

function PipelineStepInputCsv(props) {
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
                <TableCell>Name</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {
                objInputMap.value.map((obj, index) => (
                  <PipelineStepInputCsvTableRow
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

PipelineStepInputCsv.defaultProps = {
  possibleInputs: null,
};

PipelineStepInputCsv.propTypes = {
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

export default withStyles(styles)(PipelineStepInputCsv);
