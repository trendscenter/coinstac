import React, { useEffect, useState } from 'react';
import { useLazyQuery, useQuery } from '@apollo/client';
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
import { SEARCH_DATASETS_QUERY, FETCH_ALL_DATASETS_TAGS_QUERY } from '../../state/graphql/functions';

function DataDiscovery() {
  const classes = useStyles();

  const [executedFirstSearch, setExecutedFirstSearch] = useState(false);
  const [searchString, setSearchString] = useState('');

  const [searchDatasets, { data, loading }] = useLazyQuery(SEARCH_DATASETS_QUERY, { fetchPolicy: 'cache-and-network' });

  function handleSearchInputChange(e) {
    setSearchString(e.target.value);
  }

  function search() {
    setExecutedFirstSearch(true);

    searchDatasets({ variables: { searchString } });
  }

  const results = get(data, 'searchDatasets', []);

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
        <TextField
          id="search"
          label="Search"
          fullWidth
          value={searchString}
          onChange={handleSearchInputChange}
        />
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
    </div>
  );
}

DataDiscovery.propTypes = {};

export default DataDiscovery;
