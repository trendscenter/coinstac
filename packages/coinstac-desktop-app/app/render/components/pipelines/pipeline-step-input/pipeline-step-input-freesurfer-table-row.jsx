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
  const [freeSurferDataOptions, setFreeSurferDataOptions] = useState(freesurferDataOptions.freesurferROIs);
  const [file, setFile] = useState(null);
  const [inputKey, setInputKey] = useState(Date.now());

  console.log(freeSurferOptions);

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

  const getROIs = (headlessMembers) => {
    const vaultNames = values(headlessMembers);

    const allROIs = ['All Interests', ...freeSurferDataOptions];
  
    if (vaultNames.length === 0) {
      return uniq(allROIs);
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

  const selectInterest = (value, index) => {
    let v = [];
    if (value) {
      v = value;
    }
    if (v[0] && v[0].label === 'All Interests') {
      const options = getROIs().slice(1);
      updateStep({
        ...step,
        inputMap: getNewObj('value', options, index, false),
      });
    } else {
      updateStep({
        ...step,
        inputMap: getNewObj('value', v ? v.map(val => val.value) : null, index, false),
      });
    }
  };

  const handleFile = (e) => {
    const content = e.target.result;
    var lines = content.split(/\n/);
    lines.forEach((line, i) => {
      lines[i] = line.split(/\s/);
    });
    lines.shift();
    var rois = [];
    lines.forEach((line, i) => {
      rois[i] = line[0];
    });

    rois = rois.filter(n => n);

    const sortAlphaNum = (a, b) => a.localeCompare(b, 'en', { numeric: true })

    rois = rois.sort(sortAlphaNum);

    setFreeSurferDataOptions(rois);

    rois.unshift('All Interests');

    let fsOptions = rois.map(val => ({ label: val, value: val }));

    let options = [];

    options.push(fsOptions);

    setFreeSurferOptions(...options);

  }
  
  const handleFileChange = (file) => {
    let fileData = new FileReader();
    fileData.onloadend = handleFile;
    fileData.readAsText(file);
    setFile(file);
  }

  const handleFileReset = () => {
    let date = Date.now();
    setInputKey({ date });
    const freeSurferOptions = freesurferDataOptions.freesurferROIs.map((val) => {
      return { label: val, value: val };
    });
    setFreeSurferOptions(freeSurferOptions);
    setFile(null);
  }

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
          anchorEl={anchorEl}
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
        <TableCell style={{width: '50%'}}>
            <div style={{
              padding: '0.5rem', 
              marginBottom: '1rem', 
              border: '3px dashed #efefef',
              borderRadius: '0.5rem',
            }}>
            <div style={{marginBottom: '0.5rem'}}>
              <b>(Optional)</b> Choose Local ASEG file to get specific ROIs
            </div>
            <input 
              type="file" 
              onChange={e => 
                handleFileChange(e.target.files[0])}
              key={inputKey}
            />
            {file &&
            <a
              onClick={e => 
                handleFileReset()}
            >[x]</a>}
          </div>
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
