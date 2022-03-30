import React, { useState } from 'react';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client';
import { Link } from 'react-router';
import { get } from 'lodash';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Fab from '@material-ui/core/Fab';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import Autocomplete from '@material-ui/lab/Autocomplete';
import Skeleton from '@material-ui/lab/Skeleton';
import AddIcon from '@material-ui/icons/Add';
import SearchIcon from '@material-ui/icons/Search';

import useStyles from './data-discovery.styles';
import ResultItem from './result-item';
import ListDeleteModal from '../common/list-delete-modal';
import {
  SEARCH_DATASETS_QUERY,
  DELETE_DATASET_MUTATION,
  FETCH_ALL_DATASETS_SUBJECT_GROUPS_QUERY,
} from '../../state/graphql/functions';


const DATASET_MODALITY_OPTIONS = ['sMRI', 'fMRI', 'dMRI', 'pMRI'];

function DataDiscovery() {
  const classes = useStyles();

  const [executedFirstSearch, setExecutedFirstSearch] = useState(false);

  const [searchString, setSearchString] = useState('');
  const [subjectGroupsFilter, setSubjectGroupsFilter] = useState([]);
  const [modalityFilter, setModalityFilter] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [datasetToDelete, setDatasetToDelete] = useState(null);

  const { data: subjectGroupsData } = useQuery(FETCH_ALL_DATASETS_SUBJECT_GROUPS_QUERY, {
    onError: (error) => { console.error({ error }); },
  });
  const [searchDatasets, { data, loading }] = useLazyQuery(SEARCH_DATASETS_QUERY, { fetchPolicy: 'cache-and-network' });
  const [deleteRemoteDataset] = useMutation(DELETE_DATASET_MUTATION);

  function handleSearchInputChange(e) {
    setSearchString(e.target.value);
  }

  function handleSubjectGroupsChange(e, value) {
    setSubjectGroupsFilter(value);
  }

  function handleModalityChange(e, value) {
    setModalityFilter(value);
  }

  function search() {
    setExecutedFirstSearch(true);

    searchDatasets({
      variables: {
        searchString,
        subjectGroups: subjectGroupsFilter,
        modality: modalityFilter,
      },
    });
  }

  function closeDeleteModal() {
    setShowDeleteModal(false);
  }

  function confirmDelete(datasetId) {
    function action() {
      setShowDeleteModal(true);
      setDatasetToDelete(datasetId);
    }

    return action;
  }

  function deleteDataset() {
    deleteRemoteDataset({
      variables: { id: datasetToDelete },
      refetchQueries: [
        { query: SEARCH_DATASETS_QUERY, variables: { searchString } },
      ],
    });

    closeDeleteModal();
    setDatasetToDelete(false);
  }

  const results = get(data, 'searchDatasets', []);
  const subjectGroups = get(subjectGroupsData, 'fetchAllDatasetsSubjectGroups', []);

  return (
    <div>
      <div className="page-header">
        <Typography variant="h4">
          Data Discovery
        </Typography>
        <Fab
          color="primary"
          component={Link}
          to="/dashboard/data-discovery/new"
          aria-label="Create new dataset"
        >
          <AddIcon />
        </Fab>
      </div>
      <Box marginY={2}>
        <Grid container spacing={1}>
          <Grid item xs={12}>
            <TextField
              id="search"
              label="Search"
              fullWidth
              value={searchString}
              onChange={handleSearchInputChange}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Autocomplete
              multiple
              id="subject-groups-filter"
              options={subjectGroups}
              value={subjectGroupsFilter}
              onChange={handleSubjectGroupsChange}
              renderInput={params => (
                <TextField
                  {...params}
                  variant="standard"
                  label="Subject Groups"
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Autocomplete
              id="modality-filter"
              options={DATASET_MODALITY_OPTIONS}
              value={modalityFilter}
              onChange={handleModalityChange}
              renderInput={params => (
                <TextField
                  {...params}
                  variant="standard"
                  label="Modality"
                />
              )}
            />
          </Grid>
        </Grid>
        <Button
          variant="contained"
          color="primary"
          onClick={search}
          className={classes.searchButton}
        >
          Search
          <SearchIcon />
        </Button>
      </Box>
      {loading && <Skeleton variant="rect" height={150} />}
      {results && results.map(result => (
        <ResultItem
          key={result.id}
          result={result}
          onClickDelete={confirmDelete(result.id)}
          className={classes.resultItem}
        />
      ))}
      {!results.length && executedFirstSearch && (
        <Typography variant="h5">
          No results
        </Typography>
      )}
      {!executedFirstSearch && (
        <Paper elevation={1} className={classes.firstSearchInfo}>
          <Typography variant="body1">
            Select some filters and hit the Search button to find matching datasets
          </Typography>
        </Paper>
      )}
      <ListDeleteModal
        close={closeDeleteModal}
        deleteItem={deleteDataset}
        itemName="dataset description"
        show={showDeleteModal}
      />
    </div>
  );
}

DataDiscovery.propTypes = {};

export default DataDiscovery;
