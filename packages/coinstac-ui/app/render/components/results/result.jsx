import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import moment from 'moment';
import { ipcRenderer, shell } from 'electron';
import path from 'path';
import Box from './displays/box-plot';
import Scatter from './displays/scatter-plot';
import Table from './displays/result-table';
import Images from './displays/images';
import String from './displays/string';
import PipelineStep from '../pipelines/pipeline-step';
import Iframe from './displays/iframe';
import { API_TOKEN_KEY } from '../../state/ducks/auth';

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
    color: 'red',
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

    this.setState({
      run,
      plotData,
    });
    this.doFilesExist(run.id);
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

  doFilesExist = async (runId) => {
    const { auth: { user, appDirectory } } = this.props;
    const directoryPath = path.join(appDirectory, 'output', user.id, runId);
    const exist = await ipcRenderer.invoke('filesExist', { directoryPath });
    this.setState({ filesExist: exist });
  }

  render() {
    const {
      run, selectedTabIndex, plotData, computationOutput, downloading, filesExist,
    } = this.state;
    const { consortia, classes, auth: { appDirectory, user } } = this.props;
    const consortium = consortia.find(c => c.id === run.consortiumId);
    let { displayTypes } = this.state;
    let stepsLength = -1;
    let covariates = [];
    if (run && run.pipelineSnapshot) {
      stepsLength = run.pipelineSnapshot.steps.length;
    }

    if (stepsLength > 0 && run.pipelineSnapshot.steps[stepsLength - 1].inputMap
      && run.pipelineSnapshot.steps[stepsLength - 1].inputMap.covariates) {
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
              onClick={this.handleOpenResult}
            >
              Open Local Results
            </Button>
          </div>
          <div className={classes.resultButton}>
            {run.shouldUploadAssets && (
              <Button
                disabled={!run.assetsUploaded || downloading || filesExist}
                variant="contained"
                color="primary"
                style={{ marginLeft: 10 }}
                onClick={async () => {
                  const authToken = JSON.parse(localStorage.getItem(API_TOKEN_KEY)).token;
                  const clientId = user.id;
                  const { apiServer } = window.config;
                  const apiServerUrl = `${apiServer.protocol}//${apiServer.hostname}${apiServer.port ? `:${apiServer.port}` : ''}`;
                  this.setState({ downloading: true });
                  try {
                    const result = await ipcRenderer.invoke('download-run-assets', {
                      runId: run.id, authToken, clientId, apiServerUrl,
                    });
                    console.log(result);
                    this.setState({ downloading: false });
                    await this.doFilesExist(run.id);
                  } catch (e) {
                    console.log(e);
                    this.setState({ downloading: false });
                  }
                }}
              >
                Download results
              </Button>
            )}
          </div>
        </Paper>

        <Tabs
          value={selectedTabIndex}
          onChange={this.handleSelect}
        >
          {
            run && run.results && displayTypes && displayTypes.map((disp) => {
              const title = disp.type.replace('_', ' ')
                .replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

              return <Tab key={disp.type} label={`${title} View`} />;
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
                && <Box plotData={plotData.testData} />
              }
              {
                selectedDisplayType.type === 'scatter_plot'
                && <Scatter plotData={plotData.testData} />
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
                selectedDisplayType.type === 'iframe'
                && (
                  <Iframe
                    plotData={plotData}
                    title={`${consortium.name}_${run.pipelineSnapshot.name} `}
                    value={run.pipelineSnapshot.steps[0].inputMap.results_html_path.value}
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
          (!selectedDisplayType || selectedDisplayType.type === '')
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
            <Paper className={classNames(classes.paper, classes.error)}>
              {JSON.stringify(run.error.message, null, 2)}
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
};

const mapStateToProps = ({ auth, runs: { runs } }) => {
  return { auth, runs };
};

const connectedComponent = compose(
  connect(mapStateToProps),
  DragDropContext(HTML5Backend)
)(Result);

export default withStyles(styles)(connectedComponent);
