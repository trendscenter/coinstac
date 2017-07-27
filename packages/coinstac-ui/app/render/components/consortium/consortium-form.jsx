import classNames from 'classnames';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button } from 'react-bootstrap';
import { connect } from 'react-redux';
import { Field, FieldArray, formValueSelector, reduxForm } from 'redux-form';
import cloneDeep from 'lodash/cloneDeep';

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
    const covariatesIndex = values.activeComputationInputs ?
      values.activeComputationInputs.findIndex(input => (
        Array.isArray(input) &&
        input.length &&
        typeof input[0] === 'object'
      )) :
      -1;

    if (
      covariatesIndex > -1 &&
      values.activeComputationInputs[covariatesIndex].some(covariate => !(
        typeof covariate.name === 'string' && covariate.name.length &&
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
    this.handleComputationChange = this.handleComputationChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  onSubmit(data) {
    // Map form data to shape expected by coinstac-common:
    this.props.onSubmit(Object.assign({}, data, {
      activeComputationInputs: [data.activeComputationInputs],
    }));
  }


  handleComputationChange(event, newValue, previousValue) {
    const {
      array: {
        removeAll,
      },
    } = this.props;

    // TODO: Add `array.push` for new inputs here!
    if (newValue && newValue !== previousValue) {
      removeAll('activeComputationInputs');
    }
  }

  render() {
    const {
      computationInputs,
      computations,
      handleSubmit,
      isLoading,
      isNew,
      onReset,
      reset,
    } = this.props;

    // Only display computation input fields if the inputs are loaded
    const computationInputsFields = computationInputs.length ?
      (<fieldset>
        <legend className="sr-only">Computation Inputs</legend>
        <FieldArray
          component={ConsortiumComputationFields}
          computationInputs={computationInputs}
          name="activeComputationInputs"
        />
      </fieldset>) :
      undefined;

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
            onChange={this.handleComputationChange}
          />
        </fieldset>

        {computationInputsFields}

        <div className="clearfix">
          <div className="pull-right">
            <Button
              bsStyle="success"
              disabled={!!isLoading}
              type="submit"
            >
              <span className="glyphicon glyphicon-ok" />
              {isNew ? ' Create' : ' Update'}
            </Button>
            <Button
              bsStyle="link"
              onClick={() => reset() && onReset()}
              type="reset"
            >
              <span className="glyphicon glyphicon-remove" />
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
  array: PropTypes.shape({
    removeAll: PropTypes.func.isRequired,
  }).isRequired,
  computations: PropTypes.arrayOf(PropTypes.object).isRequired,
  computationInputs: PropTypes.array.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
  isNew: PropTypes.bool.isRequired,
  onReset: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  reset: PropTypes.func.isRequired,
};

ConsortiumForm.FORM_NAME = 'consortiumForm';

const selector = formValueSelector(ConsortiumForm.FORM_NAME);


/**
 * Apparently supplying a `initialValues` prop to the component magically wires
 * it up? {@link http://redux-form.com/6.0.2/examples/initializeFromState/}
 *
 * @param {Object} state
 * @param {Object} ownProps
 */
function mapStateToProps(state, { computations, consortium, isNew, isOwner }) {
  /**
   * Redux-Form's selector
   * {@link http://redux-form.com/6.6.3/docs/api/FormValueSelector.md/#selector}
   */
  const formValues = selector(
    state,
    'activeComputationId',
    'description',
    'label'
  );
  const initialValues = consortium ? cloneDeep(consortium) : {};
  let activeComputationId;

  if (formValues.description) {
    initialValues.description = formValues.description;
  }

  if (formValues.label) {
    initialValues.label = formValues.label;
  }

  if (formValues.activeComputationId) {
    activeComputationId = formValues.activeComputationId;
  } else if (initialValues.activeComputationId) {
    activeComputationId = initialValues.activeComputationId;
  } else {
    // TODO: Don't hard-code default computation
    const activeComp = computations.find(
      ({ name }) => name === 'decentralized-single-shot-ridge-regression'
    );

    if (activeComp) {
      activeComputationId = activeComp.id;
    }
  }
  const decentComp = activeComputationId ?
    computations.find(({ id }) => id === activeComputationId) :
    undefined;

  // Map computations' inputs into a Redux Form-friendly format
  const computationInputs =
    (decentComp ? decentComp.inputs[0] : []).map(
      ({
        defaultValue,
        help,
        label,
        max,
        min,
        step,
        type,
        values,
      }) => ({
        defaultValue,
        disabled: !isOwner,
        help,
        label,
        max,
        min,
        options: values,
        step,
        type,
      })
    );

  if (
    activeComputationId &&
    initialValues.activeComputationId !== activeComputationId
  ) {
    initialValues.activeComputationId = activeComputationId;
    // Do reset of initial values

    initialValues.activeComputationInputs = computationInputs.map(
      ({ defaultValue, type }) => (
        typeof defaultValue !== 'undefined' && defaultValue !== null && type === 'covariates' ? // eslint-disable-line
          JSON.parse(defaultValue) :
        typeof defaultValue !== 'undefined' && defaultValue !== null ?
          defaultValue :
          ''
      )
    );
  } else if (Array.isArray(initialValues.activeComputationInputs)) {
    // Map from document structure to form's expected structure
    initialValues.activeComputationInputs =
      initialValues.activeComputationInputs[0];
  }

  return {
    activeComputationId,
    computationInputs,
    computations,
    initialValues,
    isNew,
  };
}

export default connect(mapStateToProps)(reduxForm({
  enableReinitialize: true,
  form: ConsortiumForm.FORM_NAME,
  validate: ConsortiumForm.validate,
})(ConsortiumForm));
