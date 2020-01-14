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
    marginBottom: theme.spacing.unit * 2,
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
    const { consortium, stepFieldset, fieldsetName } = this.props;

    const stepIO = consortium.stepIO[0];

    return stepFieldset[fieldKey].map((field, k) => {
      let column = null;
      if (stepIO.covariates[k] && stepIO.covariates[k].column) {
        column = stepIO.covariates[k].column;
      }

      return (
        <MapsStepFieldCovariate
          getContainers={this.props.getContainers}
          key={`step-cov-${k}-${fieldsetName}`}
          step={field}
          type={fieldsetName}
          index={k}
          column={column}
          removeMapStep={this.props.removeMapStep}
        />
      );
    });
  };

  renderDataField = (fieldKey) => {
    const { consortium, stepFieldset, fieldsetName } = this.props;

    const stepIO = consortium.stepIO[0];

    return stepFieldset[fieldKey].map((field, k) => {
      let column = null;
      if (stepIO.data[k] && stepIO.data[k].column) {
        column = stepIO.data[k].column;
      }

      return (
        <MapsStepFieldData
          getContainers={this.props.getContainers}
          key={`step-data-${k}-${fieldsetName}`}
          step={field}
          type={fieldsetName}
          index={k}
          column={column}
          removeMapStep={this.props.removeMapStep}
        />
      );
    });
  };

  render() {
    const {
      stepFieldset,
      fieldsetName,
      classes,
    } = this.props;

    let inputCategoryName = capitalize(fieldsetName);

    if (fieldsetName !== 'covariates' && fieldsetName !== 'data') {
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
  fieldsetName: PropTypes.string.isRequired,
  consortium: PropTypes.object.isRequired,
  getContainers: PropTypes.func.isRequired,
  stepFieldset: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(MapsStepFieldset);
