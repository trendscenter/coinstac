import React from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import update from 'immutability-helper';
import Select from '../../common/react-select';
import freesurferDataOptions from '../freesurfer-data-options.json';

class PipelineStepInputFreesurferTableRow extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      openDataMenu: false,
      fsDataOptions: freesurferDataOptions,
      freeSurferOptions: [],
      file: '',
      inputKey: Date.now(),
    };

    this.openDataMenu = this.openDataMenu.bind(this);
    this.closeDataMenu = this.closeDataMenu.bind(this);
  }

  componentDidMount() {
    const { fsDataOptions } = this.state;
    const freeSurferOptions = fsDataOptions.freesurferROIs.map(val => ({ label: val, value: val }));

    this.setState({ freeSurferOptions });
  }

  selectData = (value, index) => () => {
    const { updateStep, getNewObj, step } = this.props;

    updateStep({
      ...step,
      inputMap: getNewObj(
        'type',
        value,
        index
      ),
    });

    this.closeDataMenu();
  }

  selectInterest = (value, index) => {
    let v = [];
    if (value) {
      v = value;
    }
    /* Code above is to fix issues when clearing select values in UI */
    const { fsDataOptions } = this.state;
    const { updateStep, getNewObj, step } = this.props;
    if (v[0] && v[0].label === 'All Interests') {
      const options = fsDataOptions.freesurferROIs.slice(1);
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
  }

  handleFile = (e) => {
    const content = e.target.result;
    const lines = content.split(/\n/).map(line => line.split(/\s/));
    lines.shift();

    const sortAlphaNum = (a, b) => a.localeCompare(b, 'en', { numeric: true });

    const rois = lines.map(line => line[0]).filter(n => n).sort(sortAlphaNum);

    this.setState({ fsDataOptions: { freesurferROIs: rois } });

    rois.unshift('All Interests');

    const freeSurferOptions = rois.map((val) => {
      return { label: val, value: val };
    });

    this.setState({ freeSurferOptions });
  }

  handleFileChange = (file) => {
    const fileData = new FileReader();
    fileData.onloadend = this.handleFile;
    fileData.readAsText(file);
    this.setState({ file });
  }

  handleFileReset = () => {
    this.setState({ inputKey: Date.now() });
    const freeSurferOptions = freesurferDataOptions.freesurferROIs.map((val) => {
      return { label: val, value: val };
    });
    this.setState({ freeSurferOptions });
    this.setState({ file: '' });
  }

  closeDataMenu() {
    this.setState({ openDataMenu: false });
  }

  openDataMenu(event) {
    this.dataButtonElement = event.currentTarget;
    this.setState({ openDataMenu: true });
  }

  render() {
    const {
      obj, index, objKey, objParams, owner, possibleInputs, step, updateStep,
    } = this.props;

    const {
      openDataMenu, freeSurferOptions, inputKey, file,
    } = this.state;

    return (
      <TableRow>
        <TableCell>
          <Button
            id={`${objKey}-${index}-data-dropdown`}
            variant="contained"
            color="secondary"
            disabled={!owner}
            onClick={this.openDataMenu}
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
            anchorEl={this.dataButtonElement}
            open={openDataMenu}
            onClose={this.closeDataMenu}
            id={`${objKey}-${index}-data-dropdown-menu`}
          >
            {
              objParams.items.map(item => (
                <MenuItem
                  key={`${item}-menuitem`}
                  onClick={this.selectData(item, index)}
                >
                  {item}
                </MenuItem>
              ))
            }
          </Menu>
        </TableCell>
        {obj && obj.type === 'FreeSurfer' && (
          <TableCell style={{ width: '50%' }}>
            <div
              style={{
                padding: '0.5rem',
                marginBottom: '1rem',
                border: '3px dashed #efefef',
                borderRadius: '0.5rem',
              }}
            >
              <div style={{ marginBottom: '0.5rem' }}>
                <b>(Optional)</b>
                {' '}
                Choose Local ASEG file to get specific ROIs
              </div>
              <input
                type="file"
                onChange={e => this.handleFileChange(e.target.files[0])}
                key={inputKey}
              />
              {/* eslint-disable-next-line */}
              {file && <a onClick={e => this.handleFileReset()}>[x]</a>}
            </div>
            <div id={`data-${index}-area`}>
              <Select
                value={obj.value
                  ? obj.value.map(val => ({ label: val, value: val }))
                  : []
                }
                placeholder="Select Area(s) of Interest"
                options={freeSurferOptions}
                isMulti
                onChange={value => this.selectInterest(value, index)}
                style={{ width: '100%' }}
              />
            </div>
          </TableCell>
        )}
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
  }
}

PipelineStepInputFreesurferTableRow.defaultProps = {
  possibleInputs: null,
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
};

export default PipelineStepInputFreesurferTableRow;
