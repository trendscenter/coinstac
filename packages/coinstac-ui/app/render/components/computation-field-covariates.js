import React, { Component, PropTypes } from 'react';
import {
  Button,
  ControlLabel,
  FormControl,
  FormGroup,
  HelpBlock,
} from 'react-bootstrap';

export default class ComputationFieldCovariates extends Component {
  constructor(props) {
    super(props);

    this.handleNewClick = this.handleNewClick.bind(this);
    this.getHandleValueChange = this.getHandleValueChange.bind(this);
  }

  getHandleValueChange(property, index) {
    return event => {
      // `property` will be `null` on delete clicks
      return this.props.onChange(
        property ? { [property]: event.target.value } : null,
        index
      );
    };
  }

  handleNewClick() {
    this.props.onChange(
      {
        name: '',
        type: null,
      },
      this.props.value.length
    );
  }

  render() {
    const { help, label, value: items } = this.props;

    const helpBlock = help ? <HelpBlock>{help}</HelpBlock> : undefined;

    const lastItem = items[items.length - 1];
    const isAddDisabled = lastItem && !lastItem.name && !lastItem.type;

    return (
      <fieldset className="computation-field-covariates">
        <legend>{label}</legend>
        {helpBlock}
        <ol className="list-unstyled">
          {items.map(({ name, type }, index) => {
            const typeValue = !type ? 0 : type;

            const options = [<option disabled value="0">Choose…</option>]
              .concat(Array.from(ComputationFieldCovariates.typeMap.entries())
                .map(([key, value]) => {
                  return <option value={key}>{value}</option>;
                })
              );

            return (
              <li key={index}>
                <div className="row">
                  <FormGroup
                    className="col-xs-5"
                    controlId={`computation-field-map-name-${index}`}
                  >
                    <ControlLabel>Name</ControlLabel>
                    <FormControl
                      onChange={this.getHandleValueChange('name', index)}
                      value={name}
                    />
                  </FormGroup>
                  <FormGroup
                    className="col-xs-5"
                    controlId={`computation-field-map-type-${index}`}
                  >
                    <ControlLabel>Type</ControlLabel>
                    <FormControl
                      componentClass="select"
                      onChange={this.getHandleValueChange('type', index)}
                      value={typeValue}
                    >
                      {options}
                    </FormControl>
                  </FormGroup>
                  <div className="col-xs-2">
                    <Button
                      block
                      bsStyle="danger"
                      onClick={this.getHandleValueChange(null, index)}
                    >
                      <span
                        aria-hidden="true"
                        className="glyphicon glyphicon-minus"
                      ></span>
                      {' '}
                      Delete
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
        <div className="row">
          <div className="col-xs-2 col-xs-push-10">
            <Button
              block
              bsStyle="primary"
              disabled={isAddDisabled}
              onClick={this.handleNewClick}
            >
              <span
                aria-hidden="true"
                className="glyphicon glyphicon-plus"
              ></span>
              {' '}
              New
            </Button>
          </div>
        </div>
      </fieldset>
    );
  }
}

ComputationFieldCovariates.typeMap = new Map([
  ['boolean', 'True/False'],
  ['number', 'Number'],
]);

ComputationFieldCovariates.propTypes = {
  disabled: PropTypes.bool.isRequired,
  fieldIndex: PropTypes.number,
  help: PropTypes.string,
  key: PropTypes.number.isRequired,
  label: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    type: PropTypes.oneOf(
      Array.from(ComputationFieldCovariates.typeMap.keys()).concat(null)
    ).isRequired,
  })),
};
