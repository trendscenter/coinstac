import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { capitalize } from 'lodash';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import MapsStepFieldData from './maps-step-field-data';
import MapsStepFieldCovariate from './maps-step-field-covariate';
import MapsStepFieldFixedValue from './maps-step-field-fixed-value';

const styles = theme => ({
  section: {
    marginBottom: theme.spacing(2),
  },
});

class MapsStepFieldset extends Component {
  renderFixedValueInputField = (fieldKey) => {
    const { stepFieldset, fieldsetName } = this.props;

    return (
      <MapsStepFieldFixedValue step={stepFieldset} key={fieldKey} fieldName={fieldsetName} />
    );
  };

  renderCovariatesField = (fieldKey) => {
    const {
      stepsDataMappings,
      stepFieldset,
      fieldsetName,
      registerDraggableContainer,
      unmapField,
    } = this.props;

    const firstStepDataMappings = stepsDataMappings[0];

    return stepFieldset[fieldKey].map((field) => {
      let column = null;
      if (firstStepDataMappings && 'covariates' in firstStepDataMappings) {
        const mappedField = firstStepDataMappings.covariates.find(
          c => c.pipelineVariableName === field.name
        );

        column = mappedField ? mappedField.dataFileFieldName : null;
      }

      return (
        <MapsStepFieldCovariate
          registerDraggableContainer={registerDraggableContainer}
          key={`step-cov-${field.name}-${fieldsetName}`}
          step={field}
          type={fieldsetName}
          column={column}
          unmapField={unmapField}
        />
      );
    });
  };

  renderDataField = (fieldKey) => {
    const {
      stepsDataMappings,
      stepFieldset,
      fieldsetName,
      registerDraggableContainer,
      unmapField,
    } = this.props;

    const firstStepDataMappings = stepsDataMappings[0];

    return stepFieldset[fieldKey].map((field) => {
      let column = null;
      if (firstStepDataMappings && 'data' in firstStepDataMappings) {
        const mappedField = firstStepDataMappings.data.find(
          c => c.pipelineVariableName === field.type
        );

        column = mappedField ? mappedField.dataFileFieldName : null;
      }

      return (
        <MapsStepFieldData
          registerDraggableContainer={registerDraggableContainer}
          key={`step-data-${field.name}-${fieldsetName}`}
          step={field}
          type={fieldsetName}
          column={column}
          unmapField={unmapField}
        />
      );
    });
  };

  render() {
    const {
      stepFieldset,
      fieldsetLabel,
      fieldsetName,
      classes,
    } = this.props;

    let inputCategoryName = capitalize(fieldsetName);

    if(fieldsetLabel){
      inputCategoryName = fieldsetLabel;
    } else if (fieldsetName !== 'covariates' && fieldsetName !== 'data') {
      inputCategoryName = 'Options';
    }

    return (
      <div className={classes.section}>
        <Typography variant="h6">{ inputCategoryName }</Typography>
        <div>
          {
            Object.keys(stepFieldset).map((fieldKey) => {
              switch (fieldsetName) {
                case 'data':
                  return this.renderDataField(fieldKey);
                case 'covariates':
                  return this.renderCovariatesField(fieldKey);
                default:
                  return this.renderFixedValueInputField(fieldKey);
              }
            })
          }
        </div>
      </div>
    );
  }
}

MapsStepFieldset.propTypes = {
  classes: PropTypes.object.isRequired,
  fieldsetName: PropTypes.string.isRequired,
  stepFieldset: PropTypes.object.isRequired,
  stepsDataMappings: PropTypes.array.isRequired,
  registerDraggableContainer: PropTypes.func.isRequired,
  unmapField: PropTypes.func.isRequired,
};

export default withStyles(styles)(MapsStepFieldset);
