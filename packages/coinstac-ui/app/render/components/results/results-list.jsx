import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import Typography from '@material-ui/core/Typography';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';

import RunsList from '../common/runs-list';
import FileViewer from './file-viewer';
import { isUserInGroup } from '../../utils/helpers';

const ResultsList = ({ runs, consortia }) => {
  const [selectedTab, setSelectedTab] = useState(0);

  const auth = useSelector(state => state.auth);

  const filteredRuns = useMemo(() => {
    if (!runs) return [];

    return runs.filter((run) => {
      const consortium = consortia.find(con => con.id === run.consortiumId);

      return (run.status === 'complete' || run.status === 'error')
        && consortium
        && (
          isUserInGroup(auth.user.id, run.observers)
          || (run.sharedUsers && isUserInGroup(auth.user.id, run.sharedUsers))
        );
    });
  }, [runs, consortia]);

  return (
    <div>
      <div className="page-header">
        <Typography variant="h4">
          Results
        </Typography>
      </div>

      <Tabs value={selectedTab} onChange={(_, tab) => setSelectedTab(tab)}>
        <Tab label="Results" />
        <Tab label="Files" />
      </Tabs>

      {selectedTab === 0 && (
        <RunsList
          runs={filteredRuns}
          consortia={consortia}
          noRunMessage="No results found"
        />
      )}
      {selectedTab === 1 && <FileViewer consortia={consortia} runs={runs} />}
    </div>
  );
};

ResultsList.propTypes = {
  consortia: PropTypes.array,
  runs: PropTypes.array,
};

ResultsList.defaultProps = {
  runs: null,
  consortia: null,
};

export default ResultsList;
