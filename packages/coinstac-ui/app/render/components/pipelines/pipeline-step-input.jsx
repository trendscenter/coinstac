import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  ControlLabel,
  Checkbox,
  FormGroup,
  FormControl,
  MenuItem,
} from 'react-bootstrap';
import update from 'immutability-helper';
import PipelineStepVariableTable from './pipeline-step-variable-table';

const styles = {
  covariateColumns: { textAlign: 'center' },
};

const styles = {
  covariateColumns: { textAlign: 'center' },
};

export default class PipelineStepInput extends Component {
  constructor(props) {
    super(props);

    this.addCovariate = this.addCovariate.bind(this);
    this.getNewObj = this.getNewObj.bind(this);
    this.getSourceMenuItem = this.getSourceMenuItem.bind(this);
  }

  componentWillMount() {
    const { objKey, objParams, step, updateStep } = this.props;

    // Initialize array of length input min if array of inputs required
    if (!step.ioMap[objKey] && objParams.type === 'array' &&
        !objParams.values && objParams.items === 'number') {
      let initArray = [];

      if (objParams.defaultValue && Array.isArray(objParams.defaultValue)) {
        initArray = Array.from({ length: objParams.min }, (v, i) => objParams.defaultValue[i]);
      }

      updateStep({
        ...step,
        ioMap: this.getNewObj(
          objKey,
          initArray
        ),
      });
    }
  }

  getNewObj(objKey, value, covarIndex) { // eslint-disable-line class-methods-use-this
    const { isCovariate, step: { ioMap } } = this.props;

    if (!isCovariate) {
      return { ...ioMap, [objKey]: value };
    }

    const covars = [...ioMap.covariates];
    covars.splice(covarIndex, 1, { ...covars[covarIndex], [objKey]: value });
    return { ...ioMap, covariates: [...covars] };
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

  getSourceMenuItem(type, step, index) {
    // Make Camel Case
    let typeNoSpace = type.split(' ');
    typeNoSpace = typeNoSpace[0].toLowerCase() + typeNoSpace.slice(1).join('');

    return (
      <MenuItem
        eventKey={`covariate-${typeNoSpace}-inputs-menuitem`}
        key={`covariate-${typeNoSpace}-inputs-menuitem`}
        onClick={() => this.props.updateStep({
          ...step,
          ioMap: this.getNewObj(
            'source',
            { pipelineIndex: -1, inputKey: typeNoSpace, inputLabel: type },
            index
          ),
        })}
      >
        {type}
      </MenuItem>
    );
  }

  addCovariate() {
    const {
      pipelineIndex,
      step,
      updateStep,
    } = this.props;

    updateStep({
      ...step,
      ioMap: {
        ...step.ioMap,
        covariates:
        [
          ...step.ioMap.covariates,
          {
            type: '',
            source: {
              pipelineIndex: -1,
              inputKey: pipelineIndex === 0 ? 'file' : '',
              inputLabel: pipelineIndex === 0 ? 'File' : '',
            },
          },
        ],
      },
    });
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
    } = this.props;

    return (
      <div>
        {objKey === 'covariates' &&
          <div>
            <p className="bold">Variables</p>
            <Button
              disabled={!owner}
              bsStyle="primary"
              onClick={this.addCovariate}
              style={{ marginBottom: 10 }}
            >
              <span aria-hidden="true" className="glphicon glyphicon-plus" /> Add Variable
            </Button>
            <PipelineStepVariableTable
              getNewObj={this.getNewObj}
              getSourceMenuItem={this.getSourceMenuItem}
              objKey={objKey}
              objParams={objParams}
              owner={owner}
              parentKey={parentKey}
              possibleInputs={possibleInputs}
              step={step}
              updateStep={updateStep}
            />
          </div>
        }

        {objKey !== 'covariates' &&
          <FormGroup controlId={`${parentKey}-form-group`}>
            {objParams.label &&
              <ControlLabel>{objParams.label}</ControlLabel>
            }

            {objParams.description &&
              <p>{objParams.description}</p>
            }

            {objParams.type === 'number' &&
              <FormControl
                disabled={!owner}
                inputRef={(input) => { this[objKey] = input; }}
                onChange={() => updateStep({
                  ...step,
                  ioMap: this.getNewObj(objKey, this[objKey].value),
                })}
                type="number"
                value={step.ioMap[objKey] || ''}
              />
            }

            {objParams.type === 'array' && objParams.values &&
              <FormControl
                componentClass="select"
                disabled={!owner}
                inputRef={(input) => { this[objKey] = input; }}
                multiple
                onChange={() => updateStep({
                  ...step,
                  ioMap: this.getNewObj(
                    objKey,
                    this.getSelectList(step.ioMap[objKey], this[objKey].value)
                  ),
                })}
                value={step.ioMap[objKey] || []}
              >
                {objParams.values.map(val =>
                  <option key={`${val}-select-option`} value={val}>{val}</option>
                )}
              </FormControl>
            }

            {objParams.type === 'array' && !objParams.values && objParams.items === 'number' &&
              step.ioMap[objKey] && step.ioMap[objKey].map((val, i) => (
                <FormControl
                  key={`${objKey}-${i}`}
                  disabled={!owner}
                  inputRef={(input) => { this[i] = input; }}
                  onChange={() => updateStep({
                    ...step,
                    ioMap: {
                      [objKey]: update(step.ioMap[objKey], {
                        $splice: [[i, 1, this[i].value]],
                      }),
                    },
                  })}
                  type="number"
                  value={step.ioMap[objKey][i] || ''}
                />
              ))
            }

            {objParams.type === 'boolean' &&
              <Checkbox
                disabled={!owner}
                inputRef={(input) => { this[objKey] = input; }}
                onChange={() => updateStep({
                  ...step,
                  ioMap: this.getNewObj(objKey, this[objKey].value),
                })}
                value={step.ioMap[objKey] || ''}
              >
                True?
              </Checkbox>
            }
          </FormGroup>
        }
      </div>
    );
  }
}

PipelineStepInput.defaultProps = {
  parentKey: '',
  owner: false,
  possibleInputs: [],
  updateStep: null,
};

PipelineStepInput.propTypes = {
  isCovariate: PropTypes.bool.isRequired,
  parentKey: PropTypes.string,
  pipelineIndex: PropTypes.number.isRequired,
  possibleInputs: PropTypes.array,
  objKey: PropTypes.string.isRequired,
  objParams: PropTypes.object.isRequired,
  owner: PropTypes.bool,
  step: PropTypes.object.isRequired,
  updateStep: PropTypes.func,
};
