import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  ControlLabel,
  FormControl,
  FormGroup,
  HelpBlock,
} from 'react-bootstrap';

export default class ComputationFieldBasic extends Component {
  handleButtonClick(increment) {
    const {
      input: {
        onChange,
        value,
      },
      max,
      min,
    } = this.props;
    const newValue = value + increment;

    if (
      typeof newValue === 'number' &&
      !Number.isNaN(newValue) &&
      (typeof max !== 'number' || newValue <= max) &&
      (typeof min !== 'number' || newValue >= min)
    ) {
      onChange(newValue);
    }
  }

  render() {
    const {
      disabled,
      help,
      input: {
        name,
        onChange,
        value,
      },
      label,
      max,
      min,
      options,
      step,
      type,
    } = this.props;
    const controlProps = {
      disabled,
      onChange,
      name,
      value,
    };
    const formGroupProps = {
      controlId: `computation-field-${name}`,
    };
    const helpBlock = help ?
      <HelpBlock>{help}</HelpBlock> :
      undefined;
    let formControl;

    if (type === 'select') {
      controlProps.componentClass = 'select';
      controlProps.multiple = true;
      formGroupProps.className = 'computation-field-select';

      /**
       * Redux Form transforms single-item arrays into that singular value.
       * Adjust it for the `select`.
       */
      if (!Array.isArray(value) && value !== '') {
        controlProps.value = [value];
      }

      formControl = (
        <FormControl {...controlProps}>
          {options.map((option) => {
            return <option key={option} value={option}>{option}</option>;
          })}
        </FormControl>
      );
    } else if (type === 'number') {
      const localStep = step || 1;

      controlProps.step = localStep;
      controlProps.type = 'number';
      formGroupProps.className = 'computation-field-number';

      if (max) {
        controlProps.max = max;
      }

      if (min) {
        controlProps.min = min;
      }

      if (typeof value !== 'number' || typeof value !== 'string') {
        controlProps.value = value;
      }

      formControl = (
        <div>
          <Button
            aria-label="Subtract 1"
            bsStyle="primary"
            onClick={() => this.handleButtonClick(-1 * localStep)}
          >
            <span className="glyphicon glyphicon-minus" />
          </Button>
          <FormControl {...controlProps} />
          <Button
            aria-label="Add 1"
            bsStyle="primary"
            onClick={() => this.handleButtonClick(localStep)}
          >
            <span className="glyphicon glyphicon-plus" />
          </Button>
        </div>
      );
    }

    return (
      <FormGroup {...formGroupProps}>
        <ControlLabel>{label}</ControlLabel>
        {formControl}
        {helpBlock}
      </FormGroup>
    );
  }
}

ComputationFieldBasic.propTypes = {
  disabled: PropTypes.bool.isRequired,
  help: PropTypes.string,
  label: PropTypes.string.isRequired,
  max: PropTypes.number,
  /* meta: PropTypes.shape({
    error: PropTypes.string,
    touched: PropTypes.bool.isRequired,
  }).isRequired, */
  min: PropTypes.number,
  input: PropTypes.shape({
    name: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    value: PropTypes.oneOfType([
      PropTypes.array,
      PropTypes.number,
      PropTypes.string,
    ]),
  }).isRequired,
  options: PropTypes.array,
  step: PropTypes.number,
  type: PropTypes.string.isRequired,
};

ComputationFieldBasic.defaultProps = {
  help: null,
  max: null,
  min: null,
  options: null,
  step: null,
};
