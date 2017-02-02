import classNames from 'classnames';
import React, { Component, PropTypes } from 'react';
import { Button } from 'react-bootstrap';
import { connect } from 'react-redux';
import { formValueSelector, Field, reduxForm } from 'redux-form';
import { get } from 'lodash';

import ConsortiumComputationFields from './consortium-computation-fields';
import ConsortiumComputationSelector from './consortium-computation-selector';

class ConsortiumForm extends Component {
  static renderInput(field) {
    const className = classNames({
      'form-group': true,
      'has-error': field.meta.touched && field.meta.error,
    });
    const inputProps = {
      className: 'form-control',
      id: `form-control-${field.name}`,
    };
    let helpBlock;
    let input;
    let label;

    if (field.type === 'textarea') {
      input = (
        <textarea {...inputProps} {...field.input}>
          {field.input.value}
        </textarea>
      );
    } else if (field.type === 'select') {
      input = (
        <select {...inputProps} {...field.input}>
          {field.children}
        </select>
      );
    } else {
      input = (
        <input {...inputProps} type={field.type} {...field.input} />
      );
    }

    if (field.meta.touched && field.meta.error) {
      helpBlock = <span className="help-block">{field.meta.error}</span>;
    }

    if (field.label) {
      label = (
        <label className="control-label" htmlFor={inputProps.id}>
          {field.label}
        </label>
      );
    }

    return (
      <div className={className}>
        {label}
        {input}
        {helpBlock}
      </div>
    );
  }

  static validate(values) {
    const errors = {};

    if (!values.activeComputationId) {
      errors.activeComputationId = 'Computation required';
    }

    if (!values.description) {
      errors.description = 'Description required';
    }

    if (!values.label || values.label.length < 1) {
      errors.label = 'Name required';
    }

    return errors;
  }

  constructor(props) {
    super(props);

    const inputs = get(props, 'initialValues.activeComputationInputs[0]');

    this.state = Array.isArray(inputs) ?
      // Silly React needs `this.state` to be an object
      inputs.reduce((memo, value, index) => {
        memo[index] = value;
        return memo;
      }, {}) :
      {};

    this.maybeRenderComputationFields =
      this.maybeRenderComputationFields.bind(this);
    this.onComputationFieldChange = this.onComputationFieldChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  onComputationFieldChange(fieldIndex, newValue) {
    this.setState(Object.assign({}, this.state, {
      [fieldIndex]: newValue,
    }));
  }

  onSubmit(data) {
    const inputs = this.getComputationInputs();

    this.props.onSubmit(
      inputs ?
        Object.assign({}, data, {
          activeComputationInputs: inputs.activeComputationInputs,
        }) :
        data
    );
  }

  getComputationInputs() {
    const { activeComputationId, computations } = this.props;

    if (activeComputationId) {
      const activeComputation = computations.find(({ _id }) => {
        return _id === activeComputationId;
      });

      if (
        activeComputation &&
        'inputs' in activeComputation &&
        Array.isArray(activeComputation.inputs) &&
        Array.isArray(activeComputation.inputs[0]) &&
        activeComputation.inputs[0].length
      ) {
        const fields = activeComputation.inputs[0];

        return {
          activeComputationInputs: [fields.reduce((memo, field, index) => {
            if (
              index in this.state &&
              typeof this.state[index] !== 'undefined' &&
              this.state[index] !== null
            ) {
              memo[index] = this.state[index];
            } else if ('defaultValue' in field) {
              memo[index] = field.defaultValue;
            }

            return memo;
          }, [])],
          fields,
        };
      }
    }
  }

  maybeRenderComputationFields() {
    const { isOwner } = this.props;
    const inputs = this.getComputationInputs();

    if (inputs) {
      return (
        <ConsortiumComputationFields
          activeComputationInputs={inputs.activeComputationInputs[0]}
          fields={inputs.fields}
          isOwner={isOwner}
          updateComputationField={this.onComputationFieldChange}
        />
      );
    }
  }

  render() {
    const {
      computations,
      handleSubmit,
      onReset,
      isLoading,
      reset,
      initialValues,
    } = this.props;

    return (
      <form className="consortium-form" onSubmit={handleSubmit(this.onSubmit)}>
        <Field
          component={ConsortiumForm.renderInput}
          label="Name"
          name="label"
          placeholder="Enter Name"
          type="text"
        />
        <Field
          component={ConsortiumForm.renderInput}
          label="Public Description"
          name="description"
          placeholder="Enter you description that best describes the Consortium's purpose to others"
          type="textarea"
        />
        <fieldset className="computation-select">
          <legend className="computation-select-label">
            Active Computation
          </legend>
          <Field
            component={ConsortiumComputationSelector}
            computations={computations}
            name="activeComputationId"
          />
        </fieldset>

        {this.maybeRenderComputationFields()}

        <div className="clearfix">
          <div className="pull-right">
            <Button
              bsStyle="success"
              disabled={isLoading}
              type="submit"
            >
              <span className="glyphicon glyphicon-ok"></span>
              {!!initialValues ? ' Update' : ' Create'}
            </Button>
            <Button
              bsStyle="link"
              onClick={() => reset() && onReset()}
              type="reset"
            >
              <span className="glyphicon glyphicon-remove"></span>
              {' '}
              Cancel
            </Button>
          </div>
        </div>
      </form>
    );
  }
}

ConsortiumForm.displayName = 'ConsortiumForm';

ConsortiumForm.propTypes = {
  activeComputationId: PropTypes.string,
  computations: PropTypes.arrayOf(PropTypes.object).isRequired,
  consortium: PropTypes.object,
  handleSubmit: PropTypes.func.isRequired,
  initialValues: PropTypes.object,
  isLoading: PropTypes.bool.isRequired,
  isOwner: PropTypes.bool.isRequired,
  reset: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
};

ConsortiumForm.FORM_NAME = 'consortium-form';

const selector = formValueSelector(ConsortiumForm.FORM_NAME);

/**
 * Apparently supplying a `initialValues` prop to the component magically wires
 * it up? {@link http://redux-form.com/6.0.2/examples/initializeFromState/}
 */
function mapStateToProps(state, ownProps) {
  const props = {
    activeComputationId: selector(state, 'activeComputationId'),
  };

  if (ownProps.consortium) {
    props.initialValues = ownProps.consortium;
  } else if (ownProps.computations) {
    // TODO: Don't hard-code default computation
    props.initialValues = {
      activeComputationId: ownProps.computations
        .find(c => c.name === 'decentralized-single-shot-ridge-regression')
        ._id,
    };
  }

  return props;
}

export default connect(mapStateToProps)(reduxForm({
  form: ConsortiumForm.FORM_NAME,
  pure: false,
  validate: ConsortiumForm.validate,
})(ConsortiumForm));
