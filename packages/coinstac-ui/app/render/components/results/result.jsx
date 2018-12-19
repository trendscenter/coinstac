import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import { Well } from 'react-bootstrap';
import TimeStamp from 'react-timestamp';
import BrowserHistory from 'react-router/lib/browserHistory';
import Box from './displays/box-plot';
import Scatter from './displays/scatter-plot';
import Table from './displays/result-table';
import Images from './displays/images';
import { getLocalRun } from '../../state/ducks/runs';

const styles = theme => ({
  paper: {
    ...theme.mixins.gutters(),
    paddingTop: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 2,
    marginTop: theme.spacing.unit * 2,
  },
  timestamp: {
    display: 'flex',
  },
  label: {
    fontWeight: 'bold',
    marginRight: theme.spacing.unit,
  },
});

class Result extends Component {
  constructor(props) {
    super(props);

    this.state = {
      run: {},
      computationOutput: {},
      displayTypes: [],
      plotData: [],
      selectedTabIndex: 0,
    };

    this.handleSelect = this.handleSelect.bind(this);
  }

  componentDidMount() {
    this.props.getLocalRun(this.props.params.resultId)
      .then((run) => {
        let plotData = {};

        // Checking display type of computation
        const stepsLength = run.pipelineSnapshot.steps.length;
        let displayTypes = run.pipelineSnapshot.steps[stepsLength - 1]
            .computations[0].computation.display;
        this.setState({
          computationOutput: run.pipelineSnapshot.steps[stepsLength - 1]
            .computations[0].computation.output,
          displayTypes,
        });

        if(!displayTypes.length){
          let array = [];
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
            )
          )));
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
      });
  }

  handleSelect(event, value) {
    this.setState({ selectedTabIndex: value });
  }

  render() {
    const { run, selectedTabIndex, plotData, computationOutput } = this.state;
    const { consortia, classes } = this.props;
    const consortium = consortia.find(c => c.id === run.consortiumId);
    let displayTypes = this.state.displayTypes;
    let stepsLength = -1;
    let covariates = [];
    if (run && run.pipelineSnapshot) {
      stepsLength = run.pipelineSnapshot.steps.length;
    }

    if (stepsLength > 0 && run.pipelineSnapshot.steps[stepsLength - 1].inputMap
      && run.pipelineSnapshot.steps[stepsLength - 1].inputMap.covariates) {
      covariates = run.pipelineSnapshot.steps[stepsLength - 1]
        .inputMap.covariates.ownerMappings.map(m => m.name);
    }

    if(!displayTypes.length){
      let array = [];
      array[0] = displayTypes;
      displayTypes = array;
    }

    const selectedDisplayType = run && run.results && displayTypes && displayTypes[selectedTabIndex];

    return (
      <div>
        <Button
          variant="contained"
          onClick={BrowserHistory.goBack}
        >
          <ArrowBackIcon />
        </Button>

        <Paper className={classes.paper}>
          {
            consortium && run.pipelineSnapshot
            && (
              <Typography variant="h6">
                {`Results: ${consortium.name} || ${run.pipelineSnapshot.name}`}
              </Typography>
            )
          }
          {
            run.startDate
            && (
              <div className={classes.timestamp}>
                <Typography className={classes.label}>Start date:</Typography>
                <Typography>
                  <TimeStamp
                    time={run.startDate / 1000}
                    precision={2}
                    autoUpdate={10}
                    format="full"
                  />
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
                  <TimeStamp
                    time={run.endDate / 1000}
                    precision={2}
                    autoUpdate={10}
                    format="full"
                  />
                </Typography>
              </div>
            )
          }
          {stepsLength > -1 && covariates.length > 0 &&
            <div>
              <span className="bold">Covariates: </span>
              {covariates.join(', ')}
            </div>
          }
        </Paper>

        <Tabs
          value={selectedTabIndex}
          onChange={this.handleSelect}
        >
          {
            run && run.results && displayTypes.map((disp) => {
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
                    title={`${consortium.name}_${run.pipelineSnapshot.name}`}
                  />
                )
              }
              {
                selectedDisplayType.type === 'images'
                && (
                  <Images
                    plotData={plotData}
                    title={`${consortium.name}_${run.pipelineSnapshot.name}`}
                  />
                )
              }
            </div>
          )
        }

        {
          run && run.error &&
          <Well style={{ color: 'red' }}>
            {JSON.stringify(run.error.message, null, 2)}
          </Well>
        }
      </div>
    );
  }
}

Result.propTypes = {
  consortia: PropTypes.array.isRequired,
  getLocalRun: PropTypes.func.isRequired,
  params: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
};

const mapStateToProps = ({ auth }) => {
  return { auth };
};

const connectedComponent = connect(mapStateToProps, { getLocalRun })(Result);

export default withStyles(styles)(connectedComponent);
