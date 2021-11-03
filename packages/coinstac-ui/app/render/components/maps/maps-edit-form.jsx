import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import MapsBooleanField from './fields/maps-boolean-field';
import MapsCsvField from './fields/maps-csv-field';
import MapsDirectoryField from './fields/maps-directory-field';
import MapsFilesField from './fields/maps-files-field';
import MapsObjectField from './fields/maps-object-field';
import MapsTextField from './fields/maps-text-field';

const styles = theme => ({
  rootPaper: {
    ...theme.mixins.gutters(),
    paddingTop: theme.spacing(1.5),
    paddingBottom: theme.spacing(1.5),
    marginTop: theme.spacing(1.5),
  },
  header: {
    textTransform: 'capitalize',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
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
  consortiumId, pipeline, dataMap, onSubmit, onChange, saved, classes, error
}, { router }) {
  const handleGoBackToConsortium = () => {
    localStorage.setItem('HIGHLIGHT_CONSORTIUM', consortiumId);
    router.push('/dashboard/consortia');
  };

  const pickerviews = [];
  const fieldviews = [];

  const dataCount = Object.entries(dataMap).length;

  return (
    <form onSubmit={onSubmit}>
      {dataCount > 0 && !error && (
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
        {saved && (
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
      )}
      <div>
        {
          pipeline && pipeline.steps && pipeline.steps.map((step) => {
            const { computations, inputMap } = step;

            return Object.keys(inputMap)
              .filter(inputKey => !inputMap[inputKey].fulfilled)
              .map((inputKey) => {
                const fieldDescription = computations[0].computation.input[inputKey];

                switch (fieldDescription.type) {
                  case 'csv':
                    pickerviews.push(
                      <MapsCsvField
                        key={inputKey}
                        fieldName={inputKey}
                        field={inputMap[inputKey]}
                        fieldDataMap={dataMap[inputKey]}
                        fieldDescription={fieldDescription}
                        onChange={onChange}
                      />
                    );
                    return;
                  case 'files':
                    pickerviews.push(
                      <MapsFilesField
                        key={inputKey}
                        fieldName={inputKey}
                        fieldDataMap={dataMap[inputKey]}
                        fieldDescription={fieldDescription}
                        onChange={onChange}
                      />
                    );
                    return;
                  case 'directory':
                    pickerviews.push(
                      <MapsDirectoryField
                        key={inputKey}
                        fieldName={inputKey}
                        fieldDataMap={dataMap[inputKey]}
                        fieldDescription={fieldDescription}
                        onChange={onChange}
                      />
                    );
                    return;
                  case 'number':
                    fieldviews.push(
                      <MapsTextField
                        key={inputKey}
                        fieldName={inputKey}
                        fieldDataMap={dataMap[inputKey]}
                        fieldDescription={fieldDescription}
                        onChange={onChange}
                      />
                    );
                    return;
                  case 'string':
                    fieldviews.push(
                      <MapsTextField
                        key={inputKey}
                        fieldName={inputKey}
                        fieldDataMap={dataMap[inputKey]}
                        fieldDescription={fieldDescription}
                        onChange={onChange}
                      />
                    );
                    return;
                  case 'boolean':
                    fieldviews.push(
                      <MapsBooleanField
                        key={inputKey}
                        fieldName={inputKey}
                        fieldDataMap={dataMap[inputKey]}
                        fieldDescription={fieldDescription}
                        onChange={onChange}
                      />
                    );
                    return;
                  case 'object':
                    fieldviews.push(
                      <MapsObjectField
                        key={inputKey}
                        fieldName={inputKey}
                        fieldDataMap={dataMap[inputKey]}
                        fieldDescription={fieldDescription}
                        onChange={onChange}
                      />
                    );
                    return;
                  default:
                    return null;
                }
              });
          })
        }
        {pipeline
          && (
            <div>
              {pickerviews && pickerviews.length > 0
                && (
                  <Paper className={classes.rootPaper} elevation={2}>
                    {pickerviews}
                  </Paper>
                )
              }
              {fieldviews && fieldviews.length > 0
                && (
                  <Paper className={classes.rootPaper} elevation={2}>
                    <Typography variant="h4" className={classes.header}>
                    Other Fields
                    </Typography>
                    {fieldviews}
                  </Paper>
                )
              }
            </div>
          )
        }
      </div>
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
  error: PropTypes.bool,
};

MapsEditForm.defaultProps = {
  consortiumId: '',
  pipeline: null,
  saved: false,
  error: false,
};

export default withStyles(styles)(MapsEditForm);
