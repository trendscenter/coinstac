import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { get } from 'lodash';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import IconButton from '@material-ui/core/IconButton';
import TextField from '@material-ui/core/TextField';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import FileCopyIcon from '@material-ui/icons/FileCopy';

import useStyles from './api-key-tab.styles';

import {
  GENERATE_HEADLESS_CLIENT_API_KEY_MUTATION,
} from '../../../../state/graphql/functions';

function ApiKeyTab({ headlessClientId, headlessClientData }) {
  const classes = useStyles();

  const [currentApiKey, setCurrentApiKey] = useState('');

  const [generateKeyOnRemote] = useMutation(
    GENERATE_HEADLESS_CLIENT_API_KEY_MUTATION
  );

  function copyToClipboard() {
    navigator.clipboard.writeText(currentApiKey);
  }

  async function generateApiKey() {
    const result = await generateKeyOnRemote({ variables: { headlessClientId } });

    const apiKey = get(result, 'data.generateHeadlessClientApiKey');

    setCurrentApiKey(apiKey);
  }

  function closeDialog() {
    setCurrentApiKey('');
  }

  return (
    <Box marginTop={3}>
      <Typography variant="body1">
        {headlessClientData && headlessClientData.apiKey
          && 'This cloud user already has a configured API Key. In case you lost or forgot the current API key you can generate another one.'}
        {headlessClientData && !headlessClientData.apiKey
          && 'This cloud user does not have a configured API Key. Click on the button to generate one.'}
      </Typography>
      <Button
        type="button"
        variant="contained"
        color="primary"
        onClick={generateApiKey}
        className={classes.button}
      >
        Generate API Key
      </Button>
      <Dialog open={!!currentApiKey}>
        <DialogTitle>API Key generated</DialogTitle>
        <Box paddingY={2} paddingX={3}>
          <Typography variant="body2">
            The following key was generated for this cloud user. Copy it and use it to configure the
            cloud user. This key will be visible only now. If you lose it, you&#39;ll have to
            generate another one.
          </Typography>
          <Box display="flex" alignItems="center">
            <TextField
              value={currentApiKey}
              disabled
              fullWidth
            />
            <Tooltip title="Copy to clipboard">
              <IconButton
                variant="contained"
                onClick={copyToClipboard}
              >
                <FileCopyIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        <Box textAlign="right" marginBottom={2} marginRight={3}>
          <Button
            type="button"
            variant="contained"
            color="primary"
            onClick={closeDialog}
          >
            Close
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
}

ApiKeyTab.defaultProps = {
  headlessClientId: null,
  headlessClientData: null,
};

ApiKeyTab.propTypes = {
  headlessClientId: PropTypes.string,
  headlessClientData: PropTypes.object,
};

export default ApiKeyTab;
