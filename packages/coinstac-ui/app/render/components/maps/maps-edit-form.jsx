import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import MapsCsvField from './maps-csv-field';

const styles = theme => ({
  saveButtonContainer: {
    marginTop: theme.spacing(2),
    display: 'flex',
    justifyContent: 'flex-end',
  },
});

function MapsEditForm({
  pipeline, dataMap, onSubmit, onChange, classes,
}) {
  return (
    <form onSubmit={onSubmit}>
      {
        pipeline && pipeline.steps && pipeline.steps.map((step) => {
          const { computations, inputMap } = step;

          return Object.keys(inputMap)
            .filter(inputKey => !inputMap[inputKey].fulfilled)
            .map((inputKey) => {
              const fieldDescription = computations[0].computation.input[inputKey];

              switch (fieldDescription.type) {
                case 'csv':
                  return (
                    <MapsCsvField
                      key={inputKey}
                      fieldName={inputKey}
                      field={inputMap[inputKey]}
                      fieldDataMap={dataMap[inputKey]}
                      onChange={onChange}
                    />
                  );
                // case 'files':
                //   return <MapsFilesField key={inputKey} fieldName={inputKey} />;
                default:
                  return null;
              }
            });
        })
      }
      <div className={classes.saveButtonContainer}>
        <Button
          variant="contained"
          color="primary"
          type="submit"
        >
          Save
        </Button>
      </div>
    </form>
  );
}

MapsEditForm.propTypes = {
  pipeline: PropTypes.object,
  dataMap: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  classes: PropTypes.object.isRequired,
};

MapsEditForm.defaultProps = {
  pipeline: null,
};

export default withStyles(styles)(MapsEditForm);
