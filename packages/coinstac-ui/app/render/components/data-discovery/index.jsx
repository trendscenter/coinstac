import React, { useEffect, useState } from 'react';
import { useLazyQuery, useQuery } from '@apollo/client';
import { get } from 'lodash';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import Autocomplete from '@material-ui/lab/Autocomplete';
import Skeleton from '@material-ui/lab/Skeleton';
import SearchIcon from '@material-ui/icons/Search';

import useStyles from './data-discovery.styles';
import ResultItem from './result-item';
import { SEARCH_DATASETS_QUERY, FETCH_ALL_DATASETS_TAGS_QUERY } from '../../state/graphql/functions';

function DataDiscovery() {
  const classes = useStyles();

  const [searchString, setSearchString] = useState('');
  const [searchTags, setSearchTags] = useState([]);

  const { data: tagsData } = useQuery(FETCH_ALL_DATASETS_TAGS_QUERY);
  const [searchDatasets, { data, loading }] = useLazyQuery(SEARCH_DATASETS_QUERY);

  useEffect(() => {
    searchDatasets({ variables: { searchString, tags: searchTags } });
  }, []);

  function handleSearchInputChange(e) {
    setSearchString(e.target.value);
  }

  function handleTagInputChange(e, value) {
    setSearchTags(value);
  }

  function search() {
    searchDatasets({ variables: { searchString, tags: searchTags } });
  }

  const tags = get(tagsData, 'fetchAllDatasetsTags', []);
  const results = get(data, 'searchDatasets', []);

  return (
    <div>
      <div className="page-header">
        <Typography variant="h4">
          Data Discovery
        </Typography>
      </div>
      <Box marginY={2}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField
              id="search"
              label="Search"
              fullWidth
              value={searchString}
              onChange={handleSearchInputChange}
            />
          </Grid>
          <Grid item xs={6}>
            <Autocomplete
              multiple
              id="tags-standard"
              options={tags}
              onChange={handleTagInputChange}
              renderInput={params => (
                <TextField
                  {...params}
                  variant="standard"
                  label="Tags"
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
          description={result.description}
          tags={result.tags}
          covariates={result.covariates}
          owner={result.owner}
          className={classes.resultItem}
        />
      ))}
      {!results.length && (
        <Typography variant="h5">
          No results
        </Typography>
      )}
    </div>
  );
}

DataDiscovery.propTypes = {};

export default DataDiscovery;
