import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useLazyQuery } from '@apollo/client';
import { get } from 'lodash';
import Box from '@material-ui/core/Box';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';

import { FETCH_HEADLESS_CLIENT } from '../../../state/graphql/functions';
import GeneralDataTab from './general-data-tab/general-data-tab';
import ApiKeyTab from './api-key-tab';

const TABS = {
  generalData: 'general',
  apiKeys: 'apiKeys',
};

function HeadlessEdit({ params }) {
  const { headlessClientId } = params;

  const [activeTab, setActiveTab] = useState(TABS.generalData);

  const [getHeadlessClient, { data }] = useLazyQuery(FETCH_HEADLESS_CLIENT, { fetchPolicy: 'cache-and-network' });

  useEffect(() => {
    if (!headlessClientId) return;
    getHeadlessClient({ variables: { id: headlessClientId } });
  }, [headlessClientId]);

  function changeTab(e, value) {
    setActiveTab(value);
  }

  function refetchHeadlessClient(id) {
    getHeadlessClient({ variables: { id } });
  }

  const isCreation = !headlessClientId;
  const title = isCreation ? 'Cloud User Creation' : 'Cloud User Edit';

  const headlessClientData = get(data, 'fetchHeadlessClient');

  return (
    <div>
      <Box className="page-header">
        <Typography variant="h4">
          {title}
        </Typography>
      </Box>
      <Tabs value={activeTab} onChange={changeTab}>
        <Tab id={TABS.generalData} label="General Data" value={TABS.generalData} />
        <Tab id={TABS.apiKeys} label="API Keys" value={TABS.apiKeys} disabled={!headlessClientData} />
      </Tabs>
      {activeTab === TABS.generalData && (
        <GeneralDataTab
          headlessClientId={headlessClientId}
          headlessClientData={headlessClientData}
          onHeadlessClientUpdate={refetchHeadlessClient}
        />
      )}
      {activeTab === TABS.apiKeys && (
        <ApiKeyTab
          headlessClientData={headlessClientData}
          onHeadlessClientUpdate={refetchHeadlessClient}
        />
      )}
    </div>
  );
}

HeadlessEdit.propTypes = {
  params: PropTypes.object.isRequired,
};

export default HeadlessEdit;
