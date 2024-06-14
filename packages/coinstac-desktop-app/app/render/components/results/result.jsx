import MBox from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import Paper from '@material-ui/core/Paper';
import { withStyles } from '@material-ui/core/styles';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import classNames from 'classnames';
import { ipcRenderer, shell } from 'electron';
import moment from 'moment';
import path from 'path';
import PropTypes from 'prop-types';
import React, { Component, Suspense } from 'react';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { API_TOKEN_KEY } from '../../state/ducks/constants';
import { notifyError, notifySuccess } from '../../state/ducks/notifyAndLog';
import PipelineStep from '../pipelines/pipeline-step';
import Iframe from './displays/iframe';
import Images from './displays/images';
import Table from './displays/result-table';
import String from './displays/string';

const Box = React.lazy(() => import('./displays/box-plot'));
const Scatter = React.lazy(() => import('./displays/scatter-plot'));

const styles = theme => ({
  paper: {
    padding: theme.spacing(2),
    marginTop: theme.spacing(2),
    display: 'flex',
    [theme.breakpoints.up('sm')]: {
      paddingLeft: theme.spacing(3),
      paddingRight: theme.spacing(3),
    },
  },
  resultsInfo: {
    display: 'flex',
    'flex-direction': 'column',
  },
  resultButton: {
    display: 'flex',
    'flex-direction': 'column-reverse',
  },
  timestamp: {
    display: 'flex',
  },
  label: {
    fontWeight: 'bold',
    marginRight: theme.spacing(1),
  },
  formControl: {
    marginBottom: theme.spacing(2),
  },
  error: {
    padding: theme.spacing(2),
    marginTop: theme.spacing(2),
    [theme.breakpoints.up('sm')]: {
      paddingLeft: theme.spacing(3),
      paddingRight: theme.spacing(3),
    },
    color: 'red',
    whiteSpace: 'pre-wrap',
  },
  errorSmall: {
    color: 'red',
    fontSize: '0.8rem',
  },
});

class Result extends Component {
  state = {
    run: {},
    computationOutput: {},
    displayTypes: [],
    plotData: [],
    selectedTabIndex: 0,
    downloading: false,
    filesExist: false,
    htmlPath: 'index.html',
  };

  componentDidMount() {
    const { params: { resultId }, runs } = this.props;

    const run = runs.find(run => run.id === resultId);

    let plotData = {};

    // Checking display type of computation
    const stepsLength = run.pipelineSnapshot.steps.length;

    let displayTypes = run.pipelineSnapshot.steps[stepsLength - 1]
      .computations[0].computation.display || { type: 'pipeline' };

    this.setState({
      computationOutput: run.pipelineSnapshot.steps[stepsLength - 1]
        .computations[0].computation.output,
      displayTypes,
    });

    if (displayTypes && !displayTypes.length) {
      const array = [];
      array[0] = displayTypes;
      displayTypes = array;
    }

    if (displayTypes && displayTypes.findIndex(disp => disp.type === 'scatter_plot') > -1) {
      plotData.testData = [];
      run.results.plots.map(result => (
        result.coordinates.map(val => (
          plotData.testData.push({
            name: result.title,
            x: val.x,
            y: val.y,
          })
        ))
      ));
    } else if (displayTypes && displayTypes.findIndex(disp => disp.type === 'box_plot') > -1) {
      plotData.testData = [];
      run.results.x.map(val => (
        plotData.testData.push(val)
      ));
    } else {
      plotData = run.results;
    }

    if (run.type === 'iframe' && run.pipelineSnapshot.steps[0].inputMap.results_html_path.value) {
      this.setState({ htmlPath: run.pipelineSnapshot.steps[0].inputMap.results_html_path.value });
    }

    this.setState({
      run,
      plotData,
    });
    this.doFilesExist(run);
  }

  handleOpenResult = () => {
    const { run: { id } } = this.state;
    const { auth: { user, appDirectory } } = this.props;
    const resultDir = path.join(appDirectory, 'output', user.id, id);

    shell.openPath(resultDir);
  }

  handleSelect = (_event, value) => {
    this.setState({ selectedTabIndex: value });
  }

  handleDownloadResults = async () => {
    const { run } = this.state;
    const {
      auth: { user },
      notifyError,
      notifySuccess,
    } = this.props;

    const authToken = JSON.parse(localStorage.getItem(API_TOKEN_KEY)).token;
    const clientId = user.id;
    const { apiServer } = window.config;
    const apiServerUrl = `${apiServer.protocol}//${apiServer.hostname}/${apiServer.pathname}${apiServer.port ? `:${apiServer.port}` : ''}`;

    this.setState({ downloading: true });

    try {
      await ipcRenderer.invoke('download-run-assets', {
        runId: run.id, authToken, clientId, apiServerUrl,
      });
      this.setState({ downloading: false, filesExist: true });
      notifySuccess('Files Downloaded');
    } catch (e) {
      notifyError(e.toString());
      this.setState({ downloading: false });
    }
  }

  doFilesExist = async (run) => {
    const { auth: { user, appDirectory } } = this.props;
    const directoryPath = path.join(appDirectory, 'output', user.id, run.id);
    const exist = await ipcRenderer.invoke('filesExist', { directoryPath });
    this.setState({ filesExist: exist });
    if (run.shouldUploadAssets && run.assetsUploaded && !exist) {
      this.handleDownloadResults();
    }
  }

  renderError = errors => errors.split('\n').map(elem => <div key={elem}>{elem}</div>)

  render() {
    const {
      run,
      selectedTabIndex,
      plotData,
      computationOutput,
      downloading,
      filesExist,
      htmlPath,
    } = this.state;
    const {
      consortia,
      classes,
      auth: { appDirectory, user },
    } = this.props;
    const consortium = consortia.find(c => c.id === run.consortiumId);
    let { displayTypes } = this.state;
    let stepsLength = -1;
    let covariates = [];
    if (run && run.pipelineSnapshot) {
      stepsLength = run.pipelineSnapshot.steps.length;
    }

    if (stepsLength > 0 && run.pipelineSnapshot.steps[stepsLength - 1].inputMap
      && run.pipelineSnapshot.steps[stepsLength - 1].inputMap.covariates?.value) {
      covariates = run.pipelineSnapshot.steps[stepsLength - 1]
        .inputMap.covariates.value.map(m => m.name);
    }

    if (displayTypes && !displayTypes.length) {
      const array = [];
      array[0] = displayTypes;
      displayTypes = array;
    }

    const selectedDisplayType = run && run.results
      && displayTypes && displayTypes[selectedTabIndex];
    return (
      <div>
        <Paper className={classes.paper}>
          <div className={classes.resultsInfo}>
            {
              consortium && run.pipelineSnapshot
              && (
                <Typography variant="h6">
                  {`Results: ${consortium.name} | ${run.pipelineSnapshot.name}`}
                </Typography>
              )
            }
            {
              run.startDate
              && (
                <div className={classes.timestamp}>
                  <Typography className={classes.label}>Start date:</Typography>
                  <Typography>
                    {moment.unix(run.startDate / 1000).format('MMMM Do YYYY, h:mm:ss a')}
                  </Typography>
                </div>
              )
            }
            {
              run.endDate
              && (
                <div className={classes.timestamp}>
                  <Typography className={classes.label}>End date:</Typography>
                  <Typography>
                    {moment.unix(run.endDate / 1000).format('MMMM Do YYYY, h:mm:ss a')}
                  </Typography>
                </div>
              )
            }
            {
              stepsLength > -1 && covariates.length > 0 && (
                <div>
                  <span className="bold">Covariates: </span>
                  {covariates.join(', ')}
                </div>
              )
            }
          </div>
          <div className={classes.resultButton}>
            <Button
              variant="contained"
              color="primary"
              style={{ marginLeft: 10 }}
              disabled={!filesExist || downloading}
              onClick={this.handleOpenResult}
            >
              {downloading ? (
                <>
                  Downloading results <CircularProgress style={{ marginLeft: 8 }} size={15} />
                </>
              ) : 'Open Local Results'}
            </Button>
          </div>
        </Paper>

        <Tabs
          value={selectedTabIndex}
          onChange={this.handleSelect}
        >
          {
            run && run.results && displayTypes && displayTypes.map((disp, idx) => {
              const title = (disp.type || '').replace('_', ' ')
                .replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
              // eslint-disable-next-line react/no-array-index-key
              return <Tab key={idx} label={`${title} View`} />;
            })
          }
        </Tabs>
        {
          selectedDisplayType
          && (
            <div>
              {
                selectedDisplayType.type === 'string'
                && (
                  <String
                    plotData={plotData}
                    title={`${consortium.name}_${run.pipelineSnapshot.name} `}
                  />
                )
              }
              {
                selectedDisplayType.type === 'box_plot'
                && (
                  <Suspense fallback={<span>Loading...</span>}>
                    <Box plotData={plotData.testData} />
                  </Suspense>
                )
              }
              {
                selectedDisplayType.type === 'scatter_plot'
                && (
                  <Suspense fallback={<span>Loading...</span>}>
                    <Scatter plotData={plotData.testData} />
                  </Suspense>
                )
              }
              {
                selectedDisplayType.type === 'table'
                && (
                  <Table
                    computationOutput={computationOutput}
                    plotData={plotData}
                    tables={selectedDisplayType.tables ? selectedDisplayType.tables : null}
                    title={`${consortium.name}_${run.pipelineSnapshot.name} `}
                    clients={run.clients}
                  />
                )
              }
              {
                selectedDisplayType.type === 'iframe' && filesExist
                && (
                  <Iframe
                    plotData={plotData}
                    title={`${consortium.name}_${run.pipelineSnapshot.name} `}
                    value={htmlPath}
                    appDirectory={appDirectory}
                    user={user}
                    run={run}
                  />
                )
              }
              {
                selectedDisplayType.type === 'images'
                && (
                  <Images
                    filesExist={filesExist}
                    resultsPath={path.join(appDirectory, 'output', user.id, run.id)}
                    plotData={plotData}
                    title={`${consortium.name}_${run.pipelineSnapshot.name} `}
                    user={user}
                  />
                )
              }
              {
                selectedDisplayType.type === 'pipeline' && run.pipelineSnapshot
                && (
                  <div>
                    <TextField
                      fullWidth
                      disabled
                      value={run.pipelineSnapshot.name || ''}
                      className={classes.formControl}
                      label="Name"
                    />
                    <TextField
                      fullWidth
                      disabled
                      value={run.pipelineSnapshot.description || ''}
                      className={classes.formControl}
                      label="Description"
                    />
                    {
                      run.pipelineSnapshot.steps.length > 0
                      && run.pipelineSnapshot.steps.map((step, index) => (
                        <PipelineStep
                          computationId={step.computations[0].id}
                          deleteStep={() => { }}
                          eventKey={step.id}
                          id={step.id}
                          key={step.id}
                          moveStep={() => { }}
                          owner={false}
                          pipelineIndex={index}
                          previousComputationIds={
                            run.pipelineSnapshot.steps
                              .filter((s, i) => i < index)
                              .map(s => s.computations[0].id)
                          }
                          step={step}
                          updateStep={() => { }}
                        />
                      ))
                    }
                  </div>
                )
              }
            </div>
          )
        }

        {
          (!selectedDisplayType || Object.keys(selectedDisplayType).length === 0 || selectedDisplayType.type === '')
          && (
            <Paper className={classNames(classes.paper)}>
              <table>
                <tbody>
                  <tr>
                    <td>
                      <strong>Results Object:</strong>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      {JSON.stringify(run.results)}
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <span className={classNames(classes.errorSmall)}>
                        *Output Type not defined in Compspec.
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Paper>
          )
        }

        {
          run && run.error
          && (
            <Paper className={classes.error}>
              {run.error.message && (
                <MBox>
                  {this.renderError(run.error.message)}
                </MBox>
              )}
              {run.error.stack && (
                <MBox mt={2}>
                  {this.renderError(run.error.stack)}
                </MBox>
              )}
            </Paper>
          )
        }
      </div>
    );
  }
}

Result.propTypes = {
  auth: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
  consortia: PropTypes.array.isRequired,
  runs: PropTypes.array.isRequired,
  params: PropTypes.object.isRequired,
  notifyError: PropTypes.func.isRequired,
  notifySuccess: PropTypes.func.isRequired,
};

const mapStateToProps = ({ auth, runs: { runs } }) => ({ auth, runs });

const connectedComponent = compose(
  connect(mapStateToProps, { notifySuccess, notifyError }),
  DragDropContext(HTML5Backend),
)(Result);

export default withStyles(styles)(connectedComponent);
