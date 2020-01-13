import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { capitalize } from 'lodash';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import MapsStepData from './maps-step-data';
import MapsStepCovariate from './maps-step-covariate';
import MapsStepFieldFixedValue from './maps-step-field-fixed-value';

const styles = theme => ({
  section: {
    marginBottom: theme.spacing.unit * 2,
  },
});

class MapsStepFieldset extends Component {
  renderFixedValueInputFieldset = (fieldKey) => {
    const { stepFieldset, name } = this.props;

    return (
      <MapsStepFieldFixedValue step={stepFieldset} key={fieldKey} fieldName={name} />
    );
  };

  renderCovariatesFieldset = (fieldKey) => {
    const { consortium, stepFieldset, name } = this.props;

    const stepIO = consortium.stepIO[0];

    return stepFieldset[fieldKey].map((field, k) => {
      let column = null;
      if (stepIO.covariates[k] && stepIO.covariates[k].column) {
        column = stepIO.covariates[k].column;
      }

      return (
        <MapsStepCovariate
          getContainers={this.props.getContainers}
          key={`step-cov-${k}-${name}`}
          step={field}
          type={name}
          index={k}
          column={column}
          removeMapStep={this.props.removeMapStep}
        />
      );
    });
  };

  renderDataFieldset = (fieldKey) => {
    const { consortium, stepFieldset, name } = this.props;

    const stepIO = consortium.stepIO[0];

    return stepFieldset[fieldKey].map((field, k) => {
      let column = null;
      if (stepIO.data[k] && stepIO.data[k].column) {
        column = stepIO.data[k].column;
      }

      return (
        <MapsStepData
          getContainers={this.props.getContainers}
          key={`step-data-${k}-${name}`}
          step={field}
          type={name}
          index={k}
          column={column}
          removeMapStep={this.props.removeMapStep}
        />
      );
    });
  };

  render() {
    const {
      name,
      stepFieldset,
      classes,
    } = this.props;

    let inputCategoryName = capitalize(name);

    if (name !== 'covariates' && name !== 'data') {
      inputCategoryName = 'Options';
    }

    return (
      <div className={classes.section}>
        <Typography variant="h6">{ inputCategoryName }</Typography>
        <div>
          {
            Object.keys(stepFieldset).map((fieldKey) => {
              switch (name) {
                case 'data':
                  return this.renderDataFieldset(fieldKey);
                case 'covariates':
                  return this.renderCovariatesFieldset(fieldKey);
                default:
                  return this.renderFixedValueInputFieldset(fieldKey);
              }
            })
          }
        </div>
      </div>
    );
  }
}

MapsStepFieldset.propTypes = {
  name: PropTypes.string.isRequired,
  consortium: PropTypes.object.isRequired,
  getContainers: PropTypes.func.isRequired,
  stepFieldset: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(MapsStepFieldset);
