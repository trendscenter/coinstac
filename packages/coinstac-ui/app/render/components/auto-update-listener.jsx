import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { ipcRenderer } from 'electron';
import LinearProgress from '@material-ui/core/LinearProgress';
import Typography from '@material-ui/core/Typography';
import { styled } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';

const StyledLinearProgress = styled(LinearProgress)(() => ({
  height: 10,
}));

function LinearProgressWithLabel(props) {
  const { value } = props;
  return (
    <Box sx={{ display: 'flex', 'flex-flow': 'column', 'justify-content': 'center' }}>
      <Typography variant="body1" color="text.secondary">
        {`Downloading update ${Math.round(value)}%....`}
      </Typography>
      <Box sx={{ width: '100%' }}>
        <StyledLinearProgress sx={{ 'flex-flow': 'row ' }} variant="determinate" {...props} />
      </Box>
    </Box>
  );
}

LinearProgressWithLabel.propTypes = {
  /**
   * The value of the progress indicator for the determinate and buffer variants.
   * Value between 0 and 100.
   */
  value: PropTypes.number.isRequired,
};

function AutoUpdateListener() {
  const [progress, setProgress] = useState(0);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    ipcRenderer.on('auto-update-log', (event, message) => {
      console.log(message.log); // eslint-disable-line no-console
    });
    ipcRenderer.on('auto-update-progress', (event, message) => {
      setDownloading(true);
      setProgress(message.progress);
    });
    return () => {
      ipcRenderer.removeAllListeners('auto-update-log');
      ipcRenderer.removeAllListeners('auto-update-progress');
    };
  }, []);
  useEffect(() => {
    if (progress === 100 && downloading) {
      setDownloading(false);
      ipcRenderer.removeAllListeners('auto-update-progress');
    }
  }, [progress, downloading]);
  return (
    <div className="update-download-progress">
      {downloading
      && (
        <Box sx={{ width: '100%' }}>
          <LinearProgressWithLabel variant="determinate" value={progress} />
        </Box>
      )
    }
    </div>
  );
}

export default AutoUpdateListener;
