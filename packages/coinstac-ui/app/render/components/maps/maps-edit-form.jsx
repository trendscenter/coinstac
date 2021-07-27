import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import MapsCsvField from './maps-csv-field';
import MapsFilesField from './maps-files-field';

const styles = theme => ({
  saveButtonContainer: {
    marginTop: theme.spacing(2),
    display: 'flex',
    justifyContent: 'flex-end',
  },
  successMessage: {
    fontSize: 16,
    marginRight: theme.spacing(1),
    display: 'flex',
    alignItems: 'center',
  },
  successIcon: {
    marginLeft: theme.spacing(0.5),
    width: 30,
    height: 30,
    color: '#43a047',
  },
  backButton: {
    marginLeft: theme.spacing(1),
  },
});

function MapsEditForm({
  consortiumId, pipeline, dataMap, onSubmit, onChange, saved, classes,
}, { router }) {
  const getDataIsMapped = () => {
    if (!pipeline || !pipeline.steps || pipeline.steps.length === 0) {
      return false;
    }

    for (const step of pipeline.steps) { // eslint-disable-line no-restricted-syntax
      const { inputMap } = step;

      const unmappedCount = Object.keys(inputMap)
        .filter(inputKey => !inputMap[inputKey].fulfilled)
        .filter(inputKey => !dataMap[inputKey])
        .length;

      if (unmappedCount > 0) {
        return false;
      }
    }

    return true;
  };

  const handleGoBackToConsortium = () => {
    localStorage.setItem('HIGHLIGHT_CONSORTIUM', consortiumId);
    router.push('/dashboard/consortia');
  };

  const isDataMapped = getDataIsMapped();

  return (
    <form onSubmit={onSubmit}>
      <div className={classes.saveButtonContainer}>
        {saved && (
          <span className={classes.successMessage}>
            Data map saved
            <CheckCircleIcon className={classes.successIcon} />
          </span>
        )}
        <Button
          variant="contained"
          color="primary"
          type="submit"
        >
          Save
        </Button>
        {isDataMapped && (
          <Button
            className={classes.backButton}
            variant="contained"
            color="primary"
            onClick={handleGoBackToConsortium}
          >
            Back to Consortium
          </Button>
        )}
      </div>
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
                      fieldDescription={fieldDescription}
                      onChange={onChange}
                    />
                  );
                case 'files':
                  return (
                    <MapsFilesField
                      key={inputKey}
                      fieldName={inputKey}
                      fieldDataMap={dataMap[inputKey]}
                      fieldDescription={fieldDescription}
                      onChange={onChange}
                    />
                  );
                default:
                  return null;
              }
            });
        })
      }
    </form>
  );
}

MapsEditForm.contextTypes = {
  router: PropTypes.object.isRequired,
};

MapsEditForm.propTypes = {
  consortiumId: PropTypes.string,
  pipeline: PropTypes.object,
  dataMap: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  saved: PropTypes.bool,
  classes: PropTypes.object.isRequired,
};

MapsEditForm.defaultProps = {
  consortiumId: '',
  pipeline: null,
  saved: false,
};

export default withStyles(styles)(MapsEditForm);
