import React, { useEffect, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useMutation, useLazyQuery, useQuery } from '@apollo/client';
import { get } from 'lodash';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import TextField from '@material-ui/core/TextField';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import HighlightOffIcon from '@material-ui/icons/HighlightOff';
import ReplayIcon from '@material-ui/icons/Replay';
import FileCopyIcon from '@material-ui/icons/FileCopy';

import Select from '../../common/react-select';
import ComputationWhitelistEdit from './computation-whitelist-edit';
import useStyles from './headless-edit.styles';
import {
  FETCH_ALL_USERS_QUERY,
  FETCH_HEADLESS_CLIENT,
  GENERATE_HEADLESS_CLIENT_API_KEY_MUTATION,
  CREATE_HEADLESS_CLIENT_MUTATION,
  UPDATE_HEADLESS_CLIENT_MUTATION,
} from '../../../state/graphql/functions';

function HeadlessEdit({ params }) {
  const { headlessClientId } = params;

  const classes = useStyles();

  const [formData, setFormData] = useState({});

  const { data: usersData } = useQuery(FETCH_ALL_USERS_QUERY);
  const [getHeadlessClient, { loading, data }] = useLazyQuery(FETCH_HEADLESS_CLIENT);
  const [createHeadlessClient, { data: createData }] = useMutation(CREATE_HEADLESS_CLIENT_MUTATION);
  const [updateHeadlessClient] = useMutation(UPDATE_HEADLESS_CLIENT_MUTATION);

  const [generateKeyOnRemote] = useMutation(
    GENERATE_HEADLESS_CLIENT_API_KEY_MUTATION
  );

  const users = get(usersData, 'fetchAllUsers');
  const selectedUsers = formData.owners
    ? Object.keys(formData.owners).map(id => ({ value: id, label: formData.owners[id] }))
    : [];

  const userOptions = useMemo(() => {
    if (!users) return [];
    return users.map(u => ({ label: u.username, value: u.id }));
  }, [users]);

  useEffect(() => {
    if (!headlessClientId) return;
    getHeadlessClient({ variables: { id: headlessClientId } });
  }, [headlessClientId]);

  useEffect(() => {
    if (!data) return;

    const headlessClientData = get(data, 'fetchHeadlessClient');

    if (headlessClientData) {
      const {
        name, apiKey, owners, computationWhitelist,
      } = headlessClientData;

      setFormData({
        name,
        apiKey,
        owners,
        computationWhitelist,
      });
    }
  }, [data]);

  function submit(e) {
    e.preventDefault();

    if (headlessClientId && !createData) {
      updateHeadlessClient({
        variables: {
          id: createData ? createData.id : headlessClientId,
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

  function eraseApiKey() {
    setFormData((prev) => {
      const { apiKey, ...other } = prev;
      return other;
    });
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(formData.apiKey);
  }

  async function generateApiKey() {
    const result = await generateKeyOnRemote({ variables: { headlessClientId } });

    setFormData(prev => ({
      ...prev,
      apiKey: get(result, 'data.generateHeadlessClientApiKey'),
    }));
  }

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

  const isCreation = !headlessClientId;
  const title = isCreation ? 'Cloud User Creation' : 'Cloud User Edit';

  return (
    <div>
      <div className="page-header">
        <Typography variant="h4">
          {title}
        </Typography>
      </div>
      {loading && <p>Loading...</p>}
      <form onSubmit={submit}>
        <TextField
          label="Name"
          value={formData.name || ''}
          onChange={handleTextInputChange('name')}
          className={classes.field}
          fullWidth
          required
        />
        <Box display="flex" alignItems="flex-end">
          <TextField
            label="API Key"
            value={formData.apiKey || ''}
            className={classes.field}
            disabled
            fullWidth
          />
          {formData.apiKey && (
            <React.Fragment>
              <Tooltip title="Revoke key">
                <IconButton
                  variant="contained"
                  onClick={eraseApiKey}
                >
                  <HighlightOffIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Copy to clipboard">
                <IconButton
                  variant="contained"
                  onClick={copyToClipboard}
                >
                  <FileCopyIcon />
                </IconButton>
              </Tooltip>
            </React.Fragment>
          )}
          {!formData.apiKey && (
            <Tooltip title="Generate key">
              <IconButton
                variant="contained"
                onClick={generateApiKey}
              >
                <ReplayIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
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
          />
        </Box>
        <ComputationWhitelistEdit
          computationWhitelist={formData.computationWhitelist}
          addEmptyComputation={addEmptyComputation}
          changeWhitelist={changeWhitelist}
        />
        <Box marginTop={5}>
          <Button
            variant="contained"
            color="primary"
            type="submit"
          >
            Save Changes
          </Button>
        </Box>
      </form>
    </div>
  );
}

HeadlessEdit.propTypes = {
  params: PropTypes.object.isRequired,
};

export default HeadlessEdit;
