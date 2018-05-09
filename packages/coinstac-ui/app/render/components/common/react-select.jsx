import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';

class MultiSelectField extends Component {

  constructor(props) {
    super(props);
    this.state = {
      value: [],
    };
    this.handleSelectChange = this.handleSelectChange.bind(this);
  }

  handleSelectChange(value) {
    this.setState({ value });
    this.props.change(value);
  }

  render() {
    const options = this.props.options.map((val) => {
      return { label: val, value: val };
    });
    return (
      <div className="section">
        <Select
          closeOnSelect={false}
          disabled={false}
          multi
          onChange={this.handleSelectChange}
          options={options}
          placeholder={this.props.placeholder}
          removeSelected
          simpleValue
          value={this.state.value}
        />
      </div>
    );
  }
}

MultiSelectField.propTypes = {
  options: PropTypes.array.isRequired,
  placeholder: PropTypes.string.isRequired,
  change: PropTypes.func.isRequired,
};

export default MultiSelectField;
