import React from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Tooltip from '@material-ui/core/Tooltip';
import { withStyles } from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/Add';
import InfoIcon from '@material-ui/icons/Info';
import PipelineStepMemberTable from './pipeline-step-member-table';

const styles = theme => ({
  addObjButton: {
    marginBottom: theme.spacing.unit,
    marginLeft: theme.spacing.unit,
  },
  lambdaContainer: {
    display: 'flex',
    alignItems: 'center',
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2,
    marginLeft: theme.spacing.unit,
  },
});

function PipelineStepInputWithMappings({
  objKey, objParams, owner, addClientProp, getNewObj, parentKey, possibleInputs, step,
  updateStep, classes,
}) {
  return (
    <div style={{ paddingLeft: 10 }}>
      <Typography variant="subtitle2">
        <span>{ objParams.label }</span>
      </Typography>
      {
        objParams.tooltip && (
          <Tooltip title={objParams.tooltip} placement="right-start">
            <InfoIcon />
          </Tooltip>
        )
      }
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
      <PipelineStepMemberTable
        getNewObj={getNewObj}
        objKey={objKey}
        objParams={objParams}
        owner={owner}
        parentKey={parentKey}
        possibleInputs={possibleInputs}
        step={step}
        updateStep={updateStep}
      />
    </div>
  );
}

PipelineStepInputWithMappings.defaultProps = {
  parentKey: '',
  owner: false,
  possibleInputs: [],
};

PipelineStepInputWithMappings.propTypes = {
  classes: PropTypes.object.isRequired,
  objKey: PropTypes.string.isRequired,
  objParams: PropTypes.object.isRequired,
  owner: PropTypes.bool,
  parentKey: PropTypes.string,
  possibleInputs: PropTypes.array,
  step: PropTypes.object.isRequired,
  addClientProp: PropTypes.func.isRequired,
  getNewObj: PropTypes.func.isRequired,
  updateStep: PropTypes.func.isRequired,
};

export default withStyles(styles)(PipelineStepInputWithMappings);
