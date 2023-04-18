import Box from '@material-ui/core/Box';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import Typography from '@material-ui/core/Typography';
import makeStyles from '@material-ui/core/styles/makeStyles';
import React, { useState } from 'react';
import UserAccounts from '../user-accounts';
import Permissions from '../permissions';
import PipelineStates from '../pipeline-states';

const useStyles = makeStyles(theme => ({
  title: {
    marginBottom: theme.spacing(1),
  },
}));

const Admin = () => {
  const classes = useStyles();

  const [selectedTabIndex, setSelectedTabIndex] = useState(0);

  const handleChangeTab = (_, value) => {
    setSelectedTabIndex(value);
  };

  return (
    <div>
      <div className="page-header">
        <Typography variant="h4" className={classes.title}>
          Admin
        </Typography>
      </div>

      <Tabs
        id="admin-tabs"
        value={selectedTabIndex}
        onChange={handleChangeTab}
      >
        <Tab label="User Accounts" />
        <Tab label="Permissions" />
        <Tab label="Pipeline States" />
      </Tabs>

      <Box paddingX={1} paddingY={3}>
        {selectedTabIndex === 0 && <UserAccounts />}
        {selectedTabIndex === 1 && <Permissions />}
        {selectedTabIndex === 2 && <PipelineStates />}
      </Box>
    </div>
  );
};

export default Admin;
