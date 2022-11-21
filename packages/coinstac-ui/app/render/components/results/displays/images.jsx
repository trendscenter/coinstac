/* eslint-disable react/no-find-dom-node, no-unused-vars */
import React, { Component } from 'react';
import { ipcRenderer } from 'electron';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import Divider from '@material-ui/core/Divider';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import path from 'path';

import { notifySuccess, notifyError } from '../../../state/ducks/notifyAndLog';

const styles = {
  print: { display: 'none', visibility: 'hidden' },
  container: { width: '100%' },
  column: { padding: '1rem' },
  spacer: { width: '1rem', color: '#fff !important' },
  image: { width: '100%', height: 'auto' },
  pdfLoading: { marginLeft: '.5rem' },
  subItem: {
    position: 'relative', float: 'left', width: '95%', marginRight: '5%',
  },
  subpage: {
    position: 'relative', float: 'left', width: '100%', marginBottom: '2rem',
  },
};

class Images extends Component {
  constructor(props) {
    super(props);

    this.state = {
      generatingPdf: false,
    };
  }

  /**
   * humanize
   * Converts underscored lowercase string to human readable Title
   * Also converts 'Beta' to symbol β
   * @param  {string} str Input String to Convert
   * @return {string}     Converted String to Title
   */

  // ignore weird class-methods-use-this lint error
  // eslint-disable-next-line
  humanize(str) {
    const frags = str.split('_');
    for (let i = 0; i < frags.length; i += 1) {
      frags[i] = frags[i].charAt(0).toUpperCase() + frags[i].slice(1);
    }
    let string = frags.join(' ');
    string = string.replace('Beta', 'β ');
    return string;
  }

  savePDF = async () => {
    const {
      title, resultsPath, plotData, notifySuccess, notifyError, user,
    } = this.props;

    const localItems = plotData && plotData.local_stats
      && plotData.local_stats[user.id] ? plotData.local_stats[user.id] : [];
    const globalItems = plotData && plotData.global_stats ? plotData.global_stats : [];

    this.setState({ generatingPdf: true });

    const directories = await ipcRenderer.invoke('open-dialog', { properties: ['openDirectory'] });

    if (directories && directories.length) {
      try {
        await ipcRenderer.invoke('generate-results-pdf', {
          localData: localItems,
          globalData: globalItems,
          resultsPath,
          title,
          saveDirectory: directories[0],
        });

        notifySuccess('PDF file successfully generated');
      } catch (error) {
        notifyError(error.message);
      }
    }

    this.setState({ generatingPdf: false });
  }

  render() {
    const {
      resultsPath,
      plotData,
      classes,
      filesExist,
      user,
    } = this.props;
    const { generatingPdf } = this.state;

    let globalItems;
    let localItems;
    let height = 0;

    const localCanvas = [];

    if (plotData.global_stats && plotData.local_stats) {
      globalItems = Object.keys(plotData.global_stats).length;
      localItems = Object.keys(plotData.local_stats).length;
      height = globalItems * 180;

      // eslint-disable-next-line no-unused-vars
      Object.entries(plotData.local_stats[user.id]).forEach(([key, value]) => {
        localCanvas.push(
          <canvas
            id={`local-canvas-${key}`}
            className="canvas"
            width="1600"
            height={height}
          />
        );
      });
    }

    return (
      <div>
        {globalItems && localItems && (
          <div>
            {filesExist && (
              <Box textAlign="right">
                <Button
                  variant="contained"
                  color="primary"
                  onClick={this.savePDF}
                  disabled={generatingPdf}
                >
                  Download as pdf
                  {generatingPdf && (
                    <CircularProgress
                      disableShrink
                      color="secondary"
                      size={20}
                      className={classes.pdfLoading}
                    />
                  )}
                </Button>
              </Box>
            )}
            <Box py={2}>
              {plotData && plotData.local_stats && plotData.local_stats[user.id] && (
                <Box>
                  <Typography variant="h4">Local stats</Typography>
                  {plotData.local_stats[user.id].map(localStatImg => (
                    <Box paddingY={1}>
                      <Typography variant="h5">{`Local stats - ${this.humanize(localStatImg)}`}</Typography>
                      <img
                        key={localStatImg}
                        alt={localStatImg}
                        src={filesExist ? path.join(resultsPath, localStatImg) : ''}
                        className={classes.image}
                      />
                      <Divider />
                    </Box>
                  ))}
                </Box>
              )}
              {plotData && plotData.global_stats && (
                <Box>
                  <Typography variant="h4">Global stats</Typography>
                  {plotData.global_stats.map(globalStatImg => (
                    <Box paddingY={1}>
                      <Typography variant="h5">{`Global stats - ${this.humanize(globalStatImg.replace('global_stats/', ''))}`}</Typography>
                      <img
                        key={globalStatImg}
                        alt={globalStatImg}
                        src={filesExist ? path.join(resultsPath, globalStatImg) : ''}
                        className={classes.image}
                      />
                      <Divider />
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
            <div className={classes.print}>
              <canvas ref={(ref) => { this.globalCanvas = ref; }} width="1600" height={height} />
              <div ref={(ref) => { this.localCanvasWrapper = ref; }}>
                {localCanvas}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

Images.defaultProps = {
  resultsPath: '',
};

Images.propTypes = {
  classes: PropTypes.object.isRequired,
  resultsPath: PropTypes.string,
  plotData: PropTypes.object,
  title: PropTypes.string.isRequired,
  notifySuccess: PropTypes.func.isRequired,
  notifyError: PropTypes.func.isRequired,
  filesExist: PropTypes.bool.isRequired,
  user: PropTypes.object.isRequired,
};

Images.defaultProps = {
  plotData: null,
};

const mapStateToProps = ({ auth }) => ({
  user: auth.user,
});

const connectedComponent = connect(mapStateToProps, {
  notifyError,
  notifySuccess,
})(Images);

export default withStyles(styles)(connectedComponent);
