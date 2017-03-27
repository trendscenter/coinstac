import classNames from 'classnames';
import React, { Component, PropTypes } from 'react';
import { Button } from 'react-bootstrap';
import { connect } from 'react-redux';
import { Field, FieldArray, reduxForm } from 'redux-form';

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

    /**
     * Find the `covariates` computation input and verify every covariate has a
     * `name` and `type` property.
     *
     * @todo Validate is a static method and doesn't have access to the
     * `computationInputs` property. Improve duck-like `covariateIndex` checks!
     */
    const covariatesIndex = values.activeComputationInputs.findIndex(input => (
      Array.isArray(input) &&
      input.length &&
      typeof input[0] === 'object'
    ));

    if (
      covariatesIndex > -1 &&
      values.activeComputationInputs[covariatesIndex].some((covariate) => !(
        covariate.name.length &&
        (covariate.type === 'boolean' || covariate.type === 'number')
      ))
    ) {
      errors.activeComputationInputs = {
        [covariatesIndex]: {
          _error: 'Please ensure all fields are filled',
        },
      };
    }

    return errors;
  }

  constructor(props) {
    super(props);
    this.onSubmit = this.onSubmit.bind(this);
  }

  onSubmit(data) {
    // Map form data to shape expected by coinstac-common:
    this.props.onSubmit(Object.assign({}, data, {
      activeComputationInputs: [data.activeComputationInputs],
    }));
  }

  render() {
    const {
      computations,
      computationInputs,
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

        <fieldset>
          <legend className="sr-only">Computation Inputs</legend>
          <FieldArray
            component={ConsortiumComputationFields}
            computationInputs={computationInputs}
            name="activeComputationInputs"
          />
        </fieldset>

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
  computationInputs: PropTypes.arrayOf(PropTypes.object).isRequired,
  computations: PropTypes.arrayOf(PropTypes.object).isRequired,
  consortium: PropTypes.object,
  handleSubmit: PropTypes.func.isRequired,
  initialValues: PropTypes.object,
  isLoading: PropTypes.bool.isRequired,
  isOwner: PropTypes.bool.isRequired,
  onReset: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  reset: PropTypes.func.isRequired,
};

/**
 * Apparently supplying a `initialValues` prop to the component magically wires
 * it up? {@link http://redux-form.com/6.0.2/examples/initializeFromState/}
 *
 * @param {Object} state
 * @param {Object} ownProps
 */
function mapStateToProps(state, { computations, consortium, isOwner }) {
  const initialValues = {
    activeComputationId: '',
    activeComputationInputs: [],
  };
  const computationInputs = [];

  // TODO: Don't hard-code default computation
  const decentComp = computations ?
    computations
      .find(c => c.name === 'decentralized-single-shot-ridge-regression') :
    undefined;

  if (decentComp) {
    initialValues.activeComputationId = decentComp._id;

    // Map computations' inputs into a Redux Form-friendly format
    decentComp.inputs[0].forEach(({
      defaultValue,
      help,
      label,
      max,
      min,
      step,
      type,
      values,
    }) => {
      initialValues.activeComputationInputs.push(
        typeof defaultValue !== 'undefined' || defaultValue !== null ?
        defaultValue :
        ''
      );

      computationInputs.push({
        disabled: !isOwner,
        help,
        label,
        options: values,
        max,
        min,
        step,
        type,
      });
    });
  }

  if (consortium) {
    /**
     * @todo This mutates the `activeComputationInputs` array set in the
     * previous `for` loop. Make this less confusing!
     */
    Object.assign(initialValues, consortium, {
      activeComputationInputs:
        consortium.activeComputationInputs[0],
    });
  }

  return { computationInputs, initialValues };
}

export default connect(mapStateToProps)(reduxForm({
  enableReinitialize: true,
  form: 'consortium-form',
  validate: ConsortiumForm.validate,
})(ConsortiumForm));
