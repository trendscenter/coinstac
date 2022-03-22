import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';
import { get } from 'lodash';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import InfoIcon from '@material-ui/icons/Info';

import Select from '../../../../common/react-select';
import ComputationWhitelistEditItem from './computation-whitelist-edit-item';
import useStyles from './computation-whitelist-edit.styles';
import { FETCH_ALL_COMPUTATIONS_QUERY } from '../../../../../state/graphql/functions';

function ComputationWhitelistEdit({
  computationWhitelist,
  addEmptyComputation,
  changeWhitelist,
  disabled,
  removeComputation,
}) {
  const [computationSelectValue, setComputationSelectValue] = useState(null);

  const classes = useStyles();

  const { data: computationsData } = useQuery(FETCH_ALL_COMPUTATIONS_QUERY, {
    onError: (error) => { console.error({ error }); },
  });

  const computations = get(computationsData, 'fetchAllComputations');

  const computationsDict = computations.reduce((aggr, comp) => {
    aggr[comp.id] = comp;
    return aggr;
  }, {});

  const computationOptions = useMemo(() => {
    if (!computations) return [];

    return computations
      .filter(c => !computationWhitelist || !(c.id in computationWhitelist))
      .map(c => ({ label: c.meta.name, value: c.id }));
  }, [computations, computationWhitelist]);

  function onChangeComputationSelectValue(value) {
    setComputationSelectValue(value);
  }

  function addComputation() {
    addEmptyComputation(computationSelectValue.value);
    setComputationSelectValue(null);
  }

  return (
    <Box marginTop={3}>
      <Box display="flex" alignItems="center">
        <Typography variant="h6" className={classes.cloudUserTitle}>Computation Whitelist:</Typography>
        <Tooltip
          title={
            <Typography variant="body1">Configure which computations this cloud user will be able to run</Typography>
          }
        >
          <InfoIcon />
        </Tooltip>
      </Box>
      <Box display="flex" alignItems="center">
        <Select
          value={computationSelectValue}
          options={computationOptions}
          onChange={onChangeComputationSelectValue}
          placeholder="Select a computation"
          name="add-computation-select"
          disabled={disabled}
        />
        <Button
          variant="contained"
          color="secondary"
          onClick={addComputation}
          className={classes.addComputationButton}
          disabled={!computationSelectValue || disabled}
        >
          Add computation
        </Button>
      </Box>
      {computationWhitelist && Object.keys(computationWhitelist).map((compId) => {
        const computation = computationsDict[compId];

        return (
          <Box marginTop={2} key={compId}>
            <ComputationWhitelistEditItem
              computation={computation}
              changeWhitelist={changeWhitelist}
              computationWhitelistData={computationWhitelist[compId]}
              disabled={disabled}
              removeComputation={removeComputation}
            />
          </Box>
        );
      })}
    </Box>
  );
}

ComputationWhitelistEdit.defaultProps = {
  computationWhitelist: null,
  disabled: false,
};

ComputationWhitelistEdit.propTypes = {
  computationWhitelist: PropTypes.object,
  addEmptyComputation: PropTypes.func.isRequired,
  changeWhitelist: PropTypes.func.isRequired,
  removeComputation: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default ComputationWhitelistEdit;
