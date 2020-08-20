import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Typography from '@material-ui/core/Typography';
import Tooltip from '@material-ui/core/Tooltip';
import { withStyles } from '@material-ui/core/styles';
import InfoIcon from '@material-ui/icons/Info';
import PipelineStepInputWithMappings from './pipeline-step-input-with-mappings';
import PipelineStepInputTextField from './pipeline-step-input/pipeline-step-input-textfield';
import PipelineStepInputNumberTextField from './pipeline-step-input/pipeline-step-input-number-textfield';
import PipelineStepInputArray from './pipeline-step-input/pipeline-step-input-array';
import PipelineStepInputSet from './pipeline-step-input/pipeline-step-input-set';
import PipelineStepInputMatrix from './pipeline-step-input/pipeline-step-input-matrix';
import PipelineStepInputRange from './pipeline-step-input/pipeline-step-input-range';
import PipelineStepInputSelect from './pipeline-step-input/pipeline-step-input-select';
import PipelineStepInputRadio from './pipeline-step-input/pipeline-step-input-radio';
import PipelineStepInputBoolean from './pipeline-step-input/pipeline-step-input-boolean';
import PipelineStepInputUsers from './pipeline-step-input/pipeline-step-input-users';

const styles = theme => ({
  lambdaContainer: {
    display: 'flex',
    alignItems: 'center',
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    marginLeft: theme.spacing(1),
  },
});

function objectNeedsDataMapping(objKey, objParams) {
  return objKey === 'covariates' || objKey === 'data' || objParams.type === 'file';
}

class PipelineStepInput extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isClientProp: props.objKey === 'covariates' || props.objKey === 'data',
      openInputSourceMenu: false,
    };

    this.addClientProp = this.addClientProp.bind(this);
    this.getNewObj = this.getNewObj.bind(this);
  }

  componentDidUpdate = () => {
    const {
      objKey, objParams, updateStep, step,
    } = this.props;
    if (step && objKey === 'data' && !step.dataMeta) {
      updateStep({
        ...step,
        dataMeta: objParams,
      });
    }
  }

  getNewObj(
    prop, value, clientPropIndex, isValueArray
  ) { // eslint-disable-line class-methods-use-this
    const { objKey, possibleInputs, step: { inputMap } } = this.props;
    const { isClientProp } = this.state;
    const inputCopy = { ...inputMap };

    // Close alternate source prop
    if (value.fromCache) {
      delete inputCopy.value;
    } else if (value.value) {
      delete inputCopy.fromCache;
    }

    if (!isClientProp) {
      if (value === 'DELETE_VAR') {
        delete inputCopy[prop];
        return { ...inputCopy };
      }

      return { ...inputCopy, [prop]: value };
    }

    let newArr = [];

    // Prop to change is an array type, add or remove new value to/from existing array
    if (isValueArray) {
      const newValue = value;

      if (inputCopy[objKey].ownerMappings[clientPropIndex][prop]) {
        value = [...inputCopy[objKey].ownerMappings[clientPropIndex][prop]];
      } else {
        value = [];
      }

      const index = value.indexOf(newValue);
      if (index > -1) {
        value.splice(index, 1);
      } else {
        value.push(newValue);
      }
    }

    if (inputCopy[objKey]) {
      newArr = [...inputCopy[objKey].ownerMappings];

      let newObj = { ...newArr[clientPropIndex], [prop]: value };
      if (prop === 'fromCache') {
        newObj = { [prop]: value };
      } else if ('fromCache' in newObj) {
        newObj.type = possibleInputs[newObj.fromCache.step].inputs[newObj.fromCache.variable].type;
        delete newObj.fromCache;
      }

      newArr.splice(clientPropIndex, 1, newObj);
    }

    return { ...inputCopy, [objKey]: { ownerMappings: [...newArr] } };
  }

  getSelectList(array, value) { // eslint-disable-line class-methods-use-this
    if (array) {
      const index = array.indexOf(value);
      if (index > -1) {
        return [...array.splice(index, 1)];
      }
      return [...array, value];
    }

    return [value];
  }

  // addFile = () => {
  //   const { objKey, step } = this.props;
  //   ipcPromise.send('open-dialog')
  //     .then((obj) => {
  //       const filePath = obj.paths[0];
  //       if (filePath && filePath !== '') {
  //         this.setState({ filePath });
  //       }
  //       fs.readFile(filePath, (err, data) => {
  //         if (err) {
  //          alert("An error ocurred reading the file :" + err.message);
  //         } else {
  //          console.log(btoa(this.utf8ArrayToStr(data)));
  //          this.props.updateStep({
  //            ...step,
  //            inputMap: this.getNewObj(objKey, btoa(this.utf8ArrayToStr(data))),
  //          });
  //         }
  //      });
  //   })
  //   .catch(console.log);
  // }

  // Covars or data items
  addClientProp() {
    const {
      objKey,
      step,
      updateStep,
    } = this.props;

    let ownerMappings = [{}];
    if (step.inputMap[objKey] && 'ownerMappings' in step.inputMap[objKey]) {
      ownerMappings = [
        ...step.inputMap[objKey].ownerMappings,
        {},
      ];
    }

    updateStep({
      ...step,
      inputMap: {
        ...step.inputMap,
        [objKey]: {
          ownerMappings,
        },
      },
    });
  }

  openInputSourceMenu(event) {
    this.inputSourceButtonElement = event.currentTarget;
    this.setState({ openInputSourceMenu: true });
  }

  closeInputSourceMenu() {
    this.setState({ openInputSourceMenu: false });
  }

  render() {
    const {
      objKey,
      objParams,
      parentKey,
      possibleInputs,
      owner,
      step,
      updateStep,
      users,
      classes,
    } = this.props;

    const { openInputSourceMenu } = this.state;

    let sourceDropDownLabel = null;
    let isValue = false;
    let isFromCache;
    let visibility = 'block';

    if (objParams.conditional
      && objParams.conditional.variable
      && step.inputMap) {
      visibility = 'none';
      if (step.inputMap[objParams.conditional.variable]
          && step.inputMap[objParams.conditional.variable].value
          === objParams.conditional.value) {
        visibility = 'block';
      }
    }

    if (step.inputMap[objKey] && step.inputMap[objKey].fromCache) {
      const cacheLabel = possibleInputs[step.inputMap[objKey].fromCache.step]
        .inputs[step.inputMap[objKey].fromCache.variable].label;
      sourceDropDownLabel = `Computation ${step.inputMap[objKey].fromCache.step + 1}: ${cacheLabel}`;
    }

    if (step.inputMap[objKey] && step.inputMap[objKey].value) {
      isValue = true;
    }

    if (step.inputMap[objKey] && step.inputMap[objKey].fromCache) {
      isFromCache = true;
    }

    return (
      <div style={{ position: 'relative', display: visibility }} key={`pipestep-${objKey}`}>
        {
          objectNeedsDataMapping(objKey, objParams) ? (
            <PipelineStepInputWithMappings
              objKey={objKey}
              objParams={objParams}
              owner={owner}
              addClientProp={this.addClientProp}
              getNewObj={this.getNewObj}
              parentKey={parentKey}
              possibleInputs={possibleInputs}
              step={step}
              updateStep={updateStep}
            />
          ) : (
            <div className={classes.lambdaContainer}>
              <div>
                {
                  objParams.label && (
                    <Typography variant="subtitle2">
                      <span>{ objParams.label }</span>
                      {
                        objParams.tooltip && (
                          <Tooltip title={objParams.tooltip} placement="right-start">
                            <InfoIcon />
                          </Tooltip>
                        )
                      }
                    </Typography>
                  )
                }
                {
                  objParams.description
                  && <Typography variant="body2">{ objParams.description }</Typography>
                }
                {/*
                  objParams.type === 'file'
                  && (
                    <div>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => {
                          this.saveFile(
                            this.props.pipelineId,
                            this.props.objKey
                          )
                        }}
                        style={{marginRight: '1rem'}}
                      >
                        Add File
                      </Button>
                      {
                        filePath && filePath !== ''
                        && (
                          <span>
                            <span>{filePath}</span>
                            <CloseIcon onClick={() => {
                                this.deleteFile(this.state.fileId);
                              }} />
                          </span>
                        )
                      }
                    </div>
                  )
                */}
                {
                  objParams.type === 'string' && (
                    <PipelineStepInputTextField
                      objKey={objKey}
                      objParams={objParams}
                      owner={owner}
                      isFromCache={isFromCache}
                      updateStep={updateStep}
                      getNewObj={this.getNewObj}
                      step={step}
                    />
                  )
                }
                {
                  objParams.type === 'number'
                  && (
                    <PipelineStepInputNumberTextField
                      objKey={objKey}
                      objParams={objParams}
                      owner={owner}
                      isFromCache={isFromCache}
                      updateStep={updateStep}
                      getNewObj={this.getNewObj}
                      step={step}
                    />
                  )
                }
                {
                  objParams.type === 'array' && objParams.values && (
                    <PipelineStepInputArray
                      objKey={objKey}
                      objParams={objParams}
                      owner={owner}
                      updateStep={updateStep}
                      getNewObj={this.getNewObj}
                      getSelectList={this.getSelectList}
                      step={step}
                    />
                  )
                }
                {
                  objParams.type === 'set' && (
                    <PipelineStepInputSet
                      objKey={objKey}
                      owner={owner}
                      isFromCache={isFromCache}
                      updateStep={updateStep}
                      getNewObj={this.getNewObj}
                      step={step}
                    />
                  )
                }
                {
                  objParams.type === 'range' && (
                    <PipelineStepInputRange
                      objKey={objKey}
                      objParams={objParams}
                      owner={owner}
                      updateStep={updateStep}
                      getNewObj={this.getNewObj}
                      step={step}
                    />
                  )
                }
                {
                  objParams.type === 'matrix'
                  && (
                    <PipelineStepInputMatrix
                      objKey={objKey}
                      owner={owner}
                      isFromCache={isFromCache}
                      updateStep={updateStep}
                      getNewObj={this.getNewObj}
                      step={step}
                    />
                  )
                }
                {
                  objParams.type === 'select' && (
                    <PipelineStepInputSelect
                      objKey={objKey}
                      objParams={objParams}
                      owner={owner}
                      updateStep={updateStep}
                      getNewObj={this.getNewObj}
                      step={step}
                    />
                  )
                }
                {
                  objParams.type === 'radio' && (
                    <PipelineStepInputRadio
                      objKey={objKey}
                      objParams={objParams}
                      owner={owner}
                      updateStep={updateStep}
                      getNewObj={this.getNewObj}
                      step={step}
                    />
                  )
                }
                {
                  objParams.type === 'boolean' && (
                    <PipelineStepInputBoolean
                      objKey={objKey}
                      objParams={objParams}
                      owner={owner}
                      updateStep={updateStep}
                      getNewObj={this.getNewObj}
                      step={step}
                    />
                  )
                }
                {
                  objParams.type === 'users' && (
                    <PipelineStepInputUsers
                      objKey={objKey}
                      objParams={objParams}
                      owner={owner}
                      updateStep={updateStep}
                      getNewObj={this.getNewObj}
                      step={step}
                      users={users}
                    />
                  )
                }
              </div>
              <div style={{ position: 'absolute', right: '0' }}>
                <Button
                  id={`input-source-${objKey}-dropdown`}
                  disabled={!owner || !objParams.type || isValue}
                >
                  {(!isValue && !isFromCache) ? 'Data Source' : (sourceDropDownLabel || 'Owner Defined Value')}
                </Button>
                <Menu
                  anchorEl={this.inputSourceButtonElement}
                  open={openInputSourceMenu}
                  onClose={this.closeInputSourceMenu}
                >
                  <MenuItem
                    onClick={() => updateStep({
                      ...step,
                      inputMap: this.getNewObj(objKey, 'DELETE_VAR'),
                    })}
                  >
                    None
                  </MenuItem>
                  {
                    possibleInputs.map(itemObj => (
                      // Iterate over possible computation inputs
                      Object.entries(itemObj.inputs)
                        // Filter out inputs that don't match type
                        .filter(filterIn => filterIn[1].type === objParams.type)
                        .map(itemInput => (
                          <MenuItem
                            key={`${itemInput[1].label}-Computation-${itemObj.possibleInputIndex + 1}-inputs-menuitem`}
                            onClick={() => updateStep({
                              ...step,
                              inputMap: this.getNewObj(objKey,
                                {
                                  fromCache: {
                                    step: itemObj.possibleInputIndex,
                                    variable: itemInput[0],
                                  },
                                }),
                            })}
                          >
                            {`Computation ${itemObj.possibleInputIndex + 1}: ${itemInput[1].label}`}
                          </MenuItem>
                        ))
                    ))
                  }
                </Menu>
              </div>
            </div>
          )
        }
      </div>
    );
  }
}

PipelineStepInput.defaultProps = {
  parentKey: '',
  owner: false,
  possibleInputs: [],
  users: [],
  updateStep: null,
};

PipelineStepInput.propTypes = {
  classes: PropTypes.object.isRequired,
  objKey: PropTypes.string.isRequired,
  objParams: PropTypes.object.isRequired,
  owner: PropTypes.bool,
  parentKey: PropTypes.string,
  possibleInputs: PropTypes.array,
  step: PropTypes.object.isRequired,
  users: PropTypes.array,
  updateStep: PropTypes.func,
};

export default withStyles(styles)(PipelineStepInput);
