import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import { startCase, toLower } from 'lodash';
import MapsStepMapField from './maps-step-map-field';
import MapsStepFixedValueField from './maps-step-fixed-value-field';

const styles = theme => ({
  section: {
    marginBottom: theme.spacing(2),
  },
});

class MapsStepField extends Component {
  renderFixedValueField = () => {
    const { fieldPipeline, fieldCompSpec, fieldName } = this.props;

    return (
      <MapsStepFixedValueField
        fieldPipeline={fieldPipeline}
        fieldCompSpec={fieldCompSpec}
        fieldName={fieldName}
      />
    );
  };

  renderMapField = () => {
    const {
      stepsDataMappings,
      fieldPipeline,
      fieldName,
      registerDraggableContainer,
      unmapField,
    } = this.props;

    const firstStepDataMappings = stepsDataMappings[0];

    return fieldPipeline.value.map((field) => {
      let column = null;
      if (firstStepDataMappings && fieldName in firstStepDataMappings) {
        const mappedField = firstStepDataMappings[fieldName].find(
          c => c.pipelineVariableName === field.name
        );

        column = mappedField ? mappedField.dataFileFieldName : null;
      }

      return (
        <MapsStepMapField
          registerDraggableContainer={registerDraggableContainer}
          key={`step-cov-${field.name}-${fieldName}`}
          step={field}
          type={fieldName}
          column={column}
          unmapField={unmapField}
        />
      );
    });
  };

  render() {
    const {
      fieldPipeline,
      fieldName,
      classes,
    } = this.props;

    return (
      <div className={classes.section}>
        <Typography variant="h6">{ startCase(toLower(fieldName)) }</Typography>
        <div>
          {
            fieldPipeline.fulfilled
              ? this.renderFixedValueField()
              : this.renderMapField()
          }
        </div>
      </div>
    );
  }
}

MapsStepField.propTypes = {
  classes: PropTypes.object.isRequired,
  fieldName: PropTypes.string.isRequired,
  fieldCompSpec: PropTypes.object.isRequired,
  fieldPipeline: PropTypes.object.isRequired,
  stepsDataMappings: PropTypes.array.isRequired,
  registerDraggableContainer: PropTypes.func.isRequired,
  unmapField: PropTypes.func.isRequired,
};

export default withStyles(styles)(MapsStepField);
