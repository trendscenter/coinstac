import React, { useEffect, useState } from 'react';
import { useLazyQuery, useMutation } from '@apollo/client';
import { get } from 'lodash';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';

import { FETCH_DATASET_QUERY, SAVE_DATASET_MUTATION } from '../../../state/graphql/functions';
import useStyles from './edit-dataset.styles';

function EditDataset({ params }) {
  const { datasetId } = params;

  const classes = useStyles();

  const [formData, setFormData] = useState({});
  const [submitCompleted, setSubmitCompleted] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  function onSubmitComplete() {
    setSubmitCompleted(true);
  }

  function onSubmitError(e) {
    setSubmitError(e.message);
  }

  function setInitialData(data) {
    const remoteDatasetData = get(data, 'fetchDataset');

    if (!remoteDatasetData) {
      return;
    }

    const { description, tags, covariates } = remoteDatasetData;

    const initialData = { description };

    if (tags) {
      initialData.tags = tags.join(',');
    }

    if (covariates) {
      initialData.covariates = covariates.join(',');
    }

    setFormData(initialData);
  }

  const [fetchDataset, { loading: fetching }] = useLazyQuery(FETCH_DATASET_QUERY, {
    onCompleted: setInitialData,
  });
  const [saveDataset, { data: createdData, loading: submitting }] = useMutation(
    SAVE_DATASET_MUTATION,
    {
      onCompleted: onSubmitComplete,
      onError: onSubmitError,
    }
  );

  useEffect(() => {
    if (!datasetId) return;

    fetchDataset({ variables: { id: datasetId } });
  }, [datasetId]);

  function submit(e) {
    e.preventDefault();

    setSubmitCompleted(false);
    setSubmitError(false);

    const submitData = {
      ...formData,
    };

    if (datasetId) {
      submitData.id = datasetId;
    } else if (createdData) {
      submitData.id = createdData.id;
    }

    console.log('data', submitData);

    saveDataset({ variables: { input: submitData } });
  }

  const handleTextInputChange = fieldName => (e) => {
    const { value } = e.target;

    setFormData(prev => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleArrayChange = fieldName => (e) => {
    const { value } = e.target;

    const arrayValue = value.split(',');

    setFormData(prev => ({
      ...prev,
      [fieldName]: arrayValue,
    }));
  };

  return (
    <Box>
      <Box className="page-header">
        <Typography variant="h4">
          {datasetId ? 'Edit Dataset' : 'Create dataset'}
        </Typography>
      </Box>
      <form onSubmit={submit}>
        <TextField
          label="Description"
          value={formData.description || ''}
          onChange={handleTextInputChange('description')}
          className={classes.field}
          fullWidth
          required
          disabled={submitting}
        />
        <TextField
          label="Tags"
          value={formData.tags || ''}
          onChange={handleArrayChange('tags')}
          className={classes.field}
          fullWidth
          disabled={submitting}
        />
        <TextField
          label="Covariates"
          value={formData.covariates || ''}
          onChange={handleArrayChange('covariates')}
          className={classes.field}
          fullWidth
          disabled={submitting}
        />
        <Box marginTop={5} display="flex" alignItems="center">
          <Button
            variant="contained"
            color="primary"
            type="submit"
            disabled={submitting}
          >
            Save Changes
          </Button>
          <Box marginLeft={2} display="flex" alignItems="center">
            {(submitting) && <CircularProgress size={20} />}
            {submitCompleted && (
              <React.Fragment>
                <CheckCircleIcon className={classes.successIcon} />
                <Typography variant="body2" className={classes.statusMessage}>
                  Data saved
                </Typography>
              </React.Fragment>
            )}
            {submitError && (
              <React.Fragment>
                <ErrorIcon color="error" />
                <Typography color="error" variant="body2" className={classes.statusMessage}>
                  { submitError }
                </Typography>
              </React.Fragment>
            )}
          </Box>
        </Box>
      </form>
    </Box>
  );
}

export default EditDataset;
