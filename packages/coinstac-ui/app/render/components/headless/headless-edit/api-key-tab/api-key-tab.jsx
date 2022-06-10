import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { get } from 'lodash';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import Typography from '@material-ui/core/Typography';
import JSONInput from 'react-json-editor-ajrm';
import locale from 'react-json-editor-ajrm/locale/en';

import useStyles from './api-key-tab.styles';

import {
  GENERATE_HEADLESS_CLIENT_API_KEY_MUTATION,
} from '../../../../state/graphql/functions';

function ApiKeyTab({ headlessClientData, onHeadlessClientUpdate }) {
  const classes = useStyles();

  const [currentApiKey, setCurrentApiKey] = useState('');

  function onSubmitComplete() {
    onHeadlessClientUpdate(headlessClientData.id);
  }

  const [generateKeyOnRemote] = useMutation(
    GENERATE_HEADLESS_CLIENT_API_KEY_MUTATION,
    {
      onCompleted: onSubmitComplete,
    }
  );

  async function generateApiKey() {
    const result = await generateKeyOnRemote({
      variables: { headlessClientId: headlessClientData.id },
    });

    const apiKey = get(result, 'data.generateHeadlessClientApiKey');

    setCurrentApiKey(apiKey);
  }

  function closeDialog() {
    setCurrentApiKey('');
  }

  return (
    <Box marginTop={3}>
      <Typography variant="body1">
        {headlessClientData && headlessClientData.hasApiKey
          && 'This cloud user already has a configured API Key. In case you lost or forgot the current API key you can generate another one.'}
        {headlessClientData && !headlessClientData.hasApiKey
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
        <Box paddingBottom={2} paddingX={3}>
          <Box marginBottom={2}>
            <Typography variant="body2">
              The following key was generated for this cloud user. Copy it and use it to configure
              the cloud user. This key will be visible only now. If you lose it, you&#39;ll have to
              generate another one.
            </Typography>
          </Box>
          <JSONInput
            locale={locale}
            height="150px"
            width="100%"
            viewOnly
            placeholder={[{
              id: headlessClientData.id,
              apiKey: currentApiKey,
            }]}
          />
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
  headlessClientData: null,
};

ApiKeyTab.propTypes = {
  headlessClientData: PropTypes.object,
  onHeadlessClientUpdate: PropTypes.func.isRequired,
};

export default ApiKeyTab;
