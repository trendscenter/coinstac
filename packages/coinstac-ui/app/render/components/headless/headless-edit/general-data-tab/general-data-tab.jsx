import React, { useEffect, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useMutation, useQuery } from '@apollo/client';
import { get } from 'lodash';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';

import Select from '../../../common/react-select';
import ComputationWhitelistEdit from './computation-whitelist-edit';
import {
  FETCH_ALL_USERS_QUERY,
  CREATE_HEADLESS_CLIENT_MUTATION,
  UPDATE_HEADLESS_CLIENT_MUTATION,
} from '../../../../state/graphql/functions';
import useStyles from './general-data.styles';

function GeneralDataTab({ headlessClientData, onHeadlessClientUpdate }) {
  const classes = useStyles();

  const [formData, setFormData] = useState({});
  const [submitCompleted, setSubmitCompleted] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  function onSubmitComplete(data) {
    setSubmitCompleted(true);

    const id = get(headlessClientData, 'id') || get(data, 'createHeadlessClient.id') || get(data, 'updateHeadlessClient.id');
    onHeadlessClientUpdate(id);
  }

  function onSubmitError(e) {
    setSubmitError(e.message);
  }

  const { data: usersData } = useQuery(FETCH_ALL_USERS_QUERY,
    { onError: (error) => { console.error({ error }); } });
  const [createHeadlessClient, { data: createData, loading: creating }] = useMutation(
    CREATE_HEADLESS_CLIENT_MUTATION,
    {
      onCompleted: onSubmitComplete,
      onError: onSubmitError,
    }
  );
  const [updateHeadlessClient, { loading: updating }] = useMutation(
    UPDATE_HEADLESS_CLIENT_MUTATION,
    {
      onCompleted: onSubmitComplete,
      onError: onSubmitError,
    }
  );

  useEffect(() => {
    if (!headlessClientData) return;

    const { name, owners, computationWhitelist } = headlessClientData;

    setFormData({
      name,
      owners,
      computationWhitelist,
    });
  }, [headlessClientData]);

  const users = get(usersData, 'fetchAllUsers');

  const selectedUsers = formData.owners
    ? Object.keys(formData.owners).map(id => ({ value: id, label: formData.owners[id] }))
    : [];

  const userOptions = useMemo(() => {
    if (!users) return [];
    return users.map(u => ({ label: u.username, value: u.id }));
  }, [users]);

  function submit(e) {
    e.preventDefault();

    setSubmitCompleted(false);
    setSubmitError(false);

    const id = get(headlessClientData, 'id') || get(createData, 'createHeadlessClient.id');

    if (id) {
      updateHeadlessClient({
        variables: {
          id,
          data: formData,
        },
      });
    } else {
      createHeadlessClient({ variables: { data: formData } });
    }
  }

  const handleTextInputChange = fieldName => (e) => {
    const { value } = e.target;

    setFormData(prev => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  function setOwners(value) {
    const ownersObj = value.reduce((aggr, user) => {
      aggr[user.value] = user.label;
      return aggr;
    }, {});

    setFormData(prev => ({
      ...prev,
      owners: ownersObj,
    }));
  }

  function changeWhitelist(compId, changes) {
    setFormData(prev => ({
      ...prev,
      computationWhitelist: {
        ...prev.computationWhitelist,
        [compId]: {
          ...prev.computationWhitelist[compId],
          ...changes,
        },
      },
    }));
  }

  function addEmptyComputation(compId) {
    setFormData(prev => ({
      ...prev,
      computationWhitelist: {
        ...prev.computationWhitelist,
        [compId]: {
          inputMap: {},
        },
      },
    }));
  }

  function removeComputation(compId) {
    setFormData((prev) => {
      const newCompWhitelist = Object.keys(prev.computationWhitelist)
        .filter(key => key !== compId)
        .reduce((aggr, key) => {
          aggr[key] = prev.computationWhitelist[key];
          return aggr;
        }, {});

      return {
        ...prev,
        computationWhitelist: newCompWhitelist,
      };
    });
  }

  return (
    <form onSubmit={submit}>
      <TextField
        label="Name"
        value={formData.name || ''}
        onChange={handleTextInputChange('name')}
        className={classes.field}
        fullWidth
        required
        disabled={creating || updating}
      />
      <Box marginTop={3}>
        <Typography variant="subtitle2">Owners:</Typography>
        <Select
          value={selectedUsers}
          options={userOptions}
          onChange={setOwners}
          placeholder="Select an user"
          isMulti
          removeSelected
          name="owners-select"
          disabled={creating || updating}
        />
      </Box>
      <ComputationWhitelistEdit
        computationWhitelist={formData.computationWhitelist}
        addEmptyComputation={addEmptyComputation}
        changeWhitelist={changeWhitelist}
        disabled={creating || updating}
        removeComputation={removeComputation}
      />
      <Box marginTop={5} display="flex" alignItems="center">
        <Button
          variant="contained"
          color="primary"
          type="submit"
          disabled={creating || updating}
        >
          Save Changes
        </Button>
        <Box marginLeft={2} display="flex" alignItems="center">
          {(creating || updating) && <CircularProgress size={20} />}
          {submitCompleted && (
            <React.Fragment>
              <CheckCircleIcon className={classes.successIcon} />
              Data saved
            </React.Fragment>
          )}
          {submitError && (
            <React.Fragment>
              <ErrorIcon color="error" />
              {submitError}
            </React.Fragment>
          )}
        </Box>
      </Box>
    </form>
  );
}

GeneralDataTab.defaultProps = {
  headlessClientData: null,
};

GeneralDataTab.propTypes = {
  headlessClientData: PropTypes.object,
  onHeadlessClientUpdate: PropTypes.func.isRequired,
};

export default GeneralDataTab;
