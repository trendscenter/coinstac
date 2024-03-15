import { useLazyQuery, useMutation } from '@apollo/client';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import Skeleton from '@material-ui/lab/Skeleton';
import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { FETCH_DATASET_QUERY, SAVE_DATASET_MUTATION } from '../../../state/graphql/functions';
import useStyles from './edit-dataset.styles';
import JsonField from './json-field';

function EditDataset({ params }) {
  const auth = useSelector(state => state.auth);

  const { datasetId } = params;

  const classes = useStyles();

  const [datasetDescription, setDatasetDescription] = useState({});
  const [participantsDescription, setParticipantsDescription] = useState({});
  const [otherInfo, setOtherInfo] = useState({});

  const [submitCompleted, setSubmitCompleted] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [viewOnly, setViewOnly] = useState(true);

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

    const {
      datasetDescription,
      participantsDescription,
      otherInfo,
      owner,
    } = remoteDatasetData;

    if (datasetDescription) {
      setDatasetDescription(datasetDescription);
    }

    if (participantsDescription) {
      setParticipantsDescription(participantsDescription);
    }

    if (otherInfo) {
      setOtherInfo(otherInfo);
    }

    if (auth.user.id === owner.id) {
      setViewOnly(false);
    }
  }

  const [fetchDataset, { loading: fetching }] = useLazyQuery(FETCH_DATASET_QUERY, {
    onCompleted: setInitialData,
  });
  const [saveDataset, { data: createdData, loading: submitting }] = useMutation(
    SAVE_DATASET_MUTATION,
    {
      onCompleted: onSubmitComplete,
      onError: onSubmitError,
    },
  );

  useEffect(() => {
    if (!datasetId) {
      setViewOnly(false);
      return;
    }

    fetchDataset({ variables: { id: datasetId } });
  }, [datasetId]);

  const pageTitle = useMemo(() => {
    if (viewOnly) {
      return 'View Dataset Details';
    }

    return datasetId ? 'Edit Dataset' : 'Create dataset';
  }, [viewOnly, datasetId]);

  function submit(e) {
    e.preventDefault();

    setSubmitCompleted(false);
    setSubmitError(false);

    const submitData = {
      datasetDescription,
      participantsDescription,
      otherInfo,
    };

    if (datasetId) {
      submitData.id = datasetId;
    } else if (createdData) {
      submitData.id = createdData.id;
    }

    saveDataset({ variables: { input: submitData } });
  }

  function handleDatasetDescriptionChange(value) {
    setDatasetDescription(value.jsObject);
  }

  function handleParticipantsDescriptionChange(value) {
    setParticipantsDescription(value.jsObject);
  }

  function handleOtherInfoChange(value) {
    setOtherInfo(value.jsObject);
  }

  return (
    <Box>
      <Box className="page-header" marginBottom={2}>
        <Typography variant="h4">
          {fetching ? <Skeleton /> : pageTitle}
        </Typography>
      </Box>
      <Paper elevation={1} className={classes.info}>
        <Typography variant="body1">
          {`We're currently using the BIDS standard for describing the datasets. You can read
          more about it in their `}
          <a
            href="https://bids-specification.readthedocs.io/en/stable/03-modality-agnostic-files.html"
            rel="noopener noreferrer"
            target="_blank"
          >
            project page
          </a>
          .
        </Typography>
      </Paper>
      <form onSubmit={submit}>
        <Box marginBottom={2}>
          <JsonField
            id="dataset-description"
            name="Dataset Description"
            initialValue={datasetDescription}
            onChange={handleDatasetDescriptionChange}
            disabled={submitting || viewOnly}
          />
        </Box>
        <Box marginBottom={2}>
          <JsonField
            id="participants-description"
            name="Participants Description"
            initialValue={participantsDescription}
            onChange={handleParticipantsDescriptionChange}
            disabled={submitting || viewOnly}
          />
        </Box>
        <Box marginBottom={2}>
          <JsonField
            id="other-info"
            name="Other Info"
            initialValue={otherInfo}
            onChange={handleOtherInfoChange}
            disabled={submitting || viewOnly}
          />
        </Box>
        {!viewOnly && (
          <Box marginTop={3} display="flex" alignItems="center">
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
                <>
                  <CheckCircleIcon className={classes.successIcon} />
                  <Typography variant="body2" className={classes.statusMessage}>
                    Data saved
                  </Typography>
                </>
              )}
              {submitError && (
                <>
                  <ErrorIcon color="error" />
                  <Typography color="error" variant="body2" className={classes.statusMessage}>
                    {submitError}
                  </Typography>
                </>
              )}
            </Box>
          </Box>
        )}
      </form>
    </Box>
  );
}

EditDataset.propTypes = {
  params: PropTypes.object.isRequired,
};

export default EditDataset;
