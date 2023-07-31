import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import update from 'immutability-helper';
import uniq from 'lodash/uniq';
import values from 'lodash/values';
import useOnUpdateEffect from '../../../hooks/useOnUpdateEffect';
import Select from '../../common/react-select';
import freesurferDataOptions from '../freesurfer-data-options.json';


const getROIs = (headlessMembers) => {
  const vaultNames = values(headlessMembers);

  const allROIs = ['All Interests', ...freesurferDataOptions.freesurferROIs];

  if (vaultNames.length === 0) {
    return allROIs;
  }

  let ROIs = [];

  vaultNames.forEach((vaultName) => {
    if (vaultName === 'TReNDS COBRE FreeSurfer Vault'
      || (vaultName.startsWith('gen-ec2-') && vaultName.endsWith('TReNDS COBRE FreeSurfer Vault'))
    ) {
      ROIs = [...ROIs, ...freesurferDataOptions.TReNDSCOBREFreeSurferVaultROIs];
    }

    if (vaultName === 'CMI FreeSurfer Healthy Brain Network Vault'
      || (vaultName.startsWith('gen-ec2-') && vaultName.endsWith('CMI FreeSurfer Healthy Brain Network Vault'))
    ) {
      ROIs = [...ROIs, ...freesurferDataOptions.CMIFreeSurferHealthyBrainNetworkVaultROIs];
    }
  });

  if (ROIs.length === 0) {
    return allROIs;
  }

  return uniq(['All Interests', ...ROIs]);
};

const PipelineStepInputFreesurferTableRow = ({
  step,
  obj,
  index,
  objKey,
  objParams,
  owner,
  headlessMembers,
  possibleInputs,
  updateStep,
  getNewObj,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [freeSurferOptions, setFreeSurferOptions] = useState([]);

  useEffect(() => {
    const newFreeSurferOptions = getROIs(headlessMembers)
      .map(val => ({ label: val, value: val }));
    setFreeSurferOptions(newFreeSurferOptions);
  }, [headlessMembers]);

  useOnUpdateEffect(() => {
    updateStep({
      ...step,
      inputMap: getNewObj('value', [], index, false),
    });
  }, [headlessMembers]);

  const selectData = (value, index) => {
    updateStep({
      ...step,
      inputMap: getNewObj(
        'type',
        value,
        index
      ),
    });

    setAnchorEl(null);
  };

  const selectInterest = (value, index) => {
    if (value[0] && value[0].label === 'All Interests') {
      const options = getROIs().slice(1);
      updateStep({
        ...step,
        inputMap: getNewObj('value', options, index, false),
      });
    } else {
      updateStep({
        ...step,
        inputMap: getNewObj('value', value ? value.map(val => val.value) : null, index, false),
      });
    }
  };

  return (
    <TableRow>
      <TableCell>
        <Button
          id={`${objKey}-${index}-data-dropdown`}
          variant="contained"
          color="secondary"
          disabled={!owner}
          onClick={evt => setAnchorEl(evt.currentTarget)}
        >
          {
            obj.type
            || (
              obj.fromCache && possibleInputs.length
                ? possibleInputs[obj.fromCache.step].inputs[obj.fromCache.variable].type
                : false
            )
            || 'Data Type'
          }
        </Button>
        <Menu
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          id={`${objKey}-${index}-data-dropdown-menu`}
        >
          {
            objParams.items.map(item => (
              <MenuItem
                key={`${item}-menuitem`}
                onClick={() => selectData(item, index)}
              >
                {item}
              </MenuItem>
            ))
          }
        </Menu>
      </TableCell>
      {obj && obj.type === 'FreeSurfer' ? (
        <TableCell>
          <div id={`data-${index}-area`}>
            <Select
              value={obj.value
                ? obj.value.map(val => ({ label: val, value: val }))
                : null
              }
              placeholder="Select Area(s) of Interest"
              options={freeSurferOptions}
              isMulti
              onChange={value => selectInterest(value, index)}
              style={{ width: '100%' }}
            />
          </div>
        </TableCell>) : <TableCell />}
      <TableCell>
        <Button
          variant="contained"
          color="secondary"
          disabled={!owner || !obj.type}
          onClick={() => updateStep({
            ...step,
            inputMap: {
              ...step.inputMap,
              [objKey]: {
                value: update(step.inputMap[objKey].value, {
                  $splice: [[index, 1]],
                }),
              },
            },
          })}
        >
          Remove
        </Button>
      </TableCell>
    </TableRow>
  );
};

PipelineStepInputFreesurferTableRow.defaultProps = {
  possibleInputs: null,
  headlessMembers: {},
};

PipelineStepInputFreesurferTableRow.propTypes = {
  obj: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  objKey: PropTypes.string.isRequired,
  objParams: PropTypes.object.isRequired,
  owner: PropTypes.bool.isRequired,
  step: PropTypes.object.isRequired,
  getNewObj: PropTypes.func.isRequired,
  updateStep: PropTypes.func.isRequired,
  possibleInputs: PropTypes.array,
  headlessMembers: PropTypes.object,
};

export default PipelineStepInputFreesurferTableRow;
