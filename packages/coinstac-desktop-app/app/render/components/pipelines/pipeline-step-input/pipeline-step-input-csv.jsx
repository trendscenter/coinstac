import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import makeStyles from '@material-ui/core/styles/makeStyles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import AddIcon from '@material-ui/icons/Add';
import PropTypes from 'prop-types';
import React from 'react';

import PipelineStepInputCsvTableRow from './pipeline-step-input-csv-table-row';

const useStyles = makeStyles(theme => ({
  addObjButton: {
    marginBottom: theme.spacing(1),
    marginLeft: theme.spacing(1),
  },
}));

function PipelineStepInputCsv({
  objKey,
  objParams,
  owner,
  addClientProp,
  getNewObj,
  possibleInputs,
  step,
  updateStep,
}) {
  const classes = useStyles();

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
      <Box className="scrollable-table">
        {objInputMap && objInputMap.value && (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Data Type</TableCell>
                <TableCell>Name</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody
              style={{
                overflowY: objInputMap.value.length > 5 ? 'scroll' : 'auto',
              }}
            >
              {objInputMap.value.map((obj, index) => (
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
              ))}
            </TableBody>
          </Table>
        )}
      </Box>
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
};

export default PipelineStepInputCsv;
