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
      freeSurferOptions: [],
    };

    this.openDataMenu = this.openDataMenu.bind(this);
    this.closeDataMenu = this.closeDataMenu.bind(this);
  }

  componentDidMount() {
    const freeSurferOptions = freesurferDataOptions.freesurferROIs.map((val) => {
      return { label: val, value: val };
    });

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
    const { updateStep, getNewObj, step } = this.props;
    if (value[0] && value[0].label === 'All Interests') {
      const options = freesurferDataOptions.freesurferROIs.slice(1);
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
  }

  openDataMenu(event) {
    this.dataButtonElement = event.currentTarget;
    this.setState({ openDataMenu: true });
  }

  closeDataMenu() {
    this.setState({ openDataMenu: false });
  }

  render() {
    const {
      obj, index, objKey, objParams, owner, possibleInputs, step, updateStep,
    } = this.props;

    const { openDataMenu, freeSurferOptions } = this.state;

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
              onChange={value => this.selectInterest(value, index)}
            />
          </div>
        </TableCell>
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
