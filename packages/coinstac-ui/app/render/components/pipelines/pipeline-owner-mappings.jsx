import React from 'react';
import PropTypes from 'prop-types';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import update from 'immutability-helper';
import Select from '../common/react-select';
import variableOptions from './pipeline-variable-data-options.json';

class PipelineOwnerMappings extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      openDataMenu: false,
      openCovariatesSourceMenu: false,
    };

    this.selectData = this.selectData.bind(this);
    this.selectCovariateSource = this.selectCovariateSource.bind(this);
    this.openDataMenu = this.openDataMenu.bind(this);
    this.closeDataMenu = this.closeDataMenu.bind(this);
    this.openCovariatesSourceMenu = this.openCovariatesSourceMenu.bind(this);
    this.closeCovariatesSourceMenu = this.closeCovariatesSourceMenu.bind(this);
  }

  static getCovarSourceTitle(obj) {
    if (obj.fromCache) {
      return `Step: ${obj.fromCache.step + 1}`;
    }

    if (obj.source) {
      return 'File';
    }

    return 'Data Source';
  }

  selectData(value, index) {
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

  selectCovariateSource(prop, value, index) {
    const { updateStep, getNewObj, step } = this.props;

    updateStep({
      ...step,
      inputMap: getNewObj(
        prop,
        value,
        index
      ),
    });

    this.closeCovariatesSourceMenu();
  }

  openDataMenu(event) {
    this.dataButtonElement = event.currentTarget;
    this.setState({ openDataMenu: true });
  }

  closeDataMenu() {
    this.setState({ openDataMenu: false });
  }

  openCovariatesSourceMenu(event) {
    this.covariatesSourceButtonElement = event.currentTarget;
    this.setState({ openCovariatesSourceMenu: true });
  }

  closeCovariatesSourceMenu() {
    this.setState({ openCovariatesSourceMenu: false });
  }

  render() {
    const {
      obj,
      objKey,
      index,
      owner,
      possibleInputs,
      objParams,
      getNewObj,
      updateStep,
      step,
    } = this.props;

    const { openDataMenu, openCovariatesSourceMenu } = this.state;

    const freeSurferOptions = variableOptions.freesurferROIs.map((val) => {
      return { label: val, value: val };
    });

    return (
      <TableBody>
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
                    onClick={() => this.selectData(item, index)}
                  >
                    {item}
                  </MenuItem>
                ))
              }
            </Menu>
          </TableCell>
          {
            objKey === 'data'
            && (
              <TableCell>
                {
                  obj.type === 'FreeSurfer'
                  && (
                    <div id={`data-${index}-area`}>
                      <Select
                        value={obj.value
                          ? obj.value.map(val => ({ label: val, value: val }))
                          : null
                        }
                        placeholder="Select Area(s) of Interest"
                        options={freeSurferOptions}
                        isMulti
                        onChange={value => updateStep({
                          ...step,
                          inputMap: getNewObj('value', value ? value.map(val => val.value) : null, index, false),
                        })}
                      />
                    </div>
                  )
                }
                {obj.type !== 'FreeSurfer' && <span>-</span>}
              </TableCell>
            )
          }
          {
            objKey === 'covariates'
            && (
              <TableCell>
                <Button
                  id={`input-source-${index}-dropdown`}
                  variant="contained"
                  disabled={!owner}
                  onClick={this.openCovariatesSourceMenu}
                >
                  { this.constructor.getCovarSourceTitle(obj) }
                </Button>
                <Menu
                  id={`input-source-${index}-dropdown-menu`}
                  anchorEl={this.covariatesSourceButtonElement}
                  open={openCovariatesSourceMenu}
                  onClose={this.closeCovariatesSourceMenu}
                >
                  <MenuItem
                    onClick={() => this.selectCovariateSource('source', 'file', index)}
                  >
                    File
                  </MenuItem>
                  {
                    possibleInputs.map(itemObj => (
                      Object.entries(itemObj.inputs)
                        .filter(filterIn => (
                          obj.fromCache && possibleInputs.length
                            ? filterIn[1].type && filterIn[1].type === possibleInputs[obj.fromCache.step].inputs[obj.fromCache.variable].type // eslint-disable-line
                            : filterIn[1].type && filterIn[1].type === obj.type
                        ))
                        .map(itemInput => (
                          <MenuItem
                            disabled={!owner}
                            key={`${itemInput[1].label}-Computation-${itemObj.possibleInputIndex + 1}-inputs-menuitem`}
                            onClick={() => this.selectCovariateSource('fromCache', { variable: itemInput[0], step: itemObj.possibleInputIndex }, index)}
                          >
                            {`Step ${itemObj.possibleInputIndex + 1}: ${itemInput[1].label}`}
                          </MenuItem>
                        ))
                    ))
                  }
                </Menu>
              </TableCell>
            )
          }
          {
            objKey === 'covariates'
            && (
              <TableCell>
                {
                  !obj.fromCache
                  && (
                    <TextField
                      id={`covariates-${index}-input-name`}
                      disabled={!owner}
                      placeholder="Variable Name"
                      value={obj.name || ''}
                      onChange={event => updateStep({
                        ...step,
                        inputMap: getNewObj('name', event.target.value, index),
                      })}
                    />
                  )
                }
                {
                  obj.fromCache && possibleInputs.length > 0
                  && (
                    <Typography variant="subtitle1">
                      Variable:
                        {` ${possibleInputs[obj.fromCache.step].inputs[obj.fromCache.variable].label}`}
                    </Typography>
                  )
                }
              </TableCell>
            )
          }
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
                    ownerMappings: update(step.inputMap[objKey].ownerMappings, {
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
      </TableBody>
    );
  }
}

PipelineOwnerMappings.propTypes = {
  index: PropTypes.number.isRequired,
  obj: PropTypes.object.isRequired,
  objKey: PropTypes.string.isRequired,
  objParams: PropTypes.object.isRequired,
  owner: PropTypes.bool.isRequired,
  possibleInputs: PropTypes.array.isRequired,
  step: PropTypes.object.isRequired,
  getNewObj: PropTypes.func.isRequired,
  updateStep: PropTypes.func.isRequired,
};

export default PipelineOwnerMappings;
