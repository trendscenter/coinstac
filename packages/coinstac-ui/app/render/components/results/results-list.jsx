import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import Typography from '@material-ui/core/Typography';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import { withStyles } from '@material-ui/core/styles';

import RunsList from '../common/runs-list';
import FileViewer from './file-viewer';
import { isUserInGroup } from '../../utils/helpers';

const styles = theme => ({
  pageTitle: {
    marginBottom: theme.spacing(2),
  },
});

const ResultsList = ({ runs, consortia, classes }) => {
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
        <Typography variant="h4" className={classes.pageTitle}>
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
  classes: PropTypes.object.isRequired,
  consortia: PropTypes.array,
  runs: PropTypes.array,
};

ResultsList.defaultProps = {
  runs: null,
  consortia: null,
};

export default withStyles(styles)(ResultsList);
