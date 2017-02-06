import React, { Component, PropTypes } from 'react';
import {
  Button,
  ControlLabel,
  FormControl,
  FormGroup,
  HelpBlock,
} from 'react-bootstrap';

const INPUT_REF = 'computation-field-input';

export default class ComputationFieldBasic extends Component {
  constructor(props) {
    super(props);
    this.handleButtonClick = this.handleButtonClick.bind(this);
  }

  handleButtonClick(increment) {
    const { max, min, onChange } = this.props;
    const value = this.refs[INPUT_REF].props.value + increment;

    if (
      (typeof max !== 'number' || value <= max) &&
      (typeof min !== 'number' || value >= min)
    ) {
      onChange({
        target: { value },
      });
    }
  }

  render() {
    const {
      disabled = false,
      fieldIndex,
      help,
      label,
      max,
      min,
      onChange,
      options,
      step,
      type,
      value,
    } = this.props;
    const controlProps = {
      disabled,
      onChange,
    };
    const formGroupProps = {
      controlId: `computation-field-${fieldIndex}`,
    };
    const helpBlock = help ?
      <HelpBlock>{help}</HelpBlock> :
      undefined;
    let formControl;

    if (type === 'select') {
      controlProps.componentClass = 'select';
      controlProps.multiple = true;
      controlProps.value = Array.isArray(value) ? value : [];
      formGroupProps.className = 'computation-field-select';

      formControl = (
        <FormControl {...controlProps}>
          {options.map((option, index) => {
            return <option key={index} value={index}>{option}</option>;
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
            <span className="glyphicon glyphicon-minus"></span>
          </Button>
          <FormControl ref={INPUT_REF} {...controlProps} />
          <Button
            aria-label="Add 1"
            bsStyle="primary"
            onClick={() => this.handleButtonClick(localStep)}
          >
            <span className="glyphicon glyphicon-plus"></span>
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
  fieldIndex: PropTypes.number.isRequired,
  help: PropTypes.string,
  label: PropTypes.string.isRequired,
  max: PropTypes.number,
  min: PropTypes.number,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.array,
  step: PropTypes.number,
  type: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.number,
    PropTypes.string,
  ]),
};
