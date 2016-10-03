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
    const value = this.refs[INPUT_REF].props.value + increment;
    this.props.onChange({
      target: { value },
    });
  }

  render() {
    const {
      disabled = false,
      fieldIndex,
      help,
      label,
      onChange,
      options,
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
      controlProps.type = 'number';
      formGroupProps.className = 'computation-field-number';

      if (value) {
        controlProps.value = value;
      }

      formControl = (
        <div>
          <Button
            aria-label="Subtract 1"
            bsStyle="primary"
            onClick={() => this.handleButtonClick(-1)}
          >
            <span className="glyphicon glyphicon-minus"></span>
          </Button>
          <FormControl ref={INPUT_REF} {...controlProps} />
          <Button
            aria-label="Add 1"
            bsStyle="primary"
            onClick={() => this.handleButtonClick(1)}
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
  onChange: PropTypes.func.isRequired,
  options: PropTypes.array,
  type: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.number,
    PropTypes.string,
  ]),
};
