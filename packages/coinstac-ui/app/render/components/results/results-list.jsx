import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Typography from '@material-ui/core/Typography';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import { withStyles } from '@material-ui/core/styles';
import RunsList from '../common/runs-list';
import FileViewer from './file-viewer';

const styles = theme => ({
  pageTitle: {
    marginBottom: theme.spacing(2),
  },
});

const ResultsList = ({ runs, consortia, classes }) => {
  const [selectedTab, setSelectedTab] = useState(0);

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
          consortia={consortia}
          hoursSinceActive={0}
          limitToComplete
          runs={runs}
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
