import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Button, Glyphicon, Tabs, Tab, Well } from 'react-bootstrap';
import BrowserHistory from 'react-router/lib/browserHistory';
import Box from './displays/box-plot';
import Scatter from './displays/scatter-plot';
import Table from './displays/result-table';
import { getLocalRun } from '../../state/ducks/runs';

class Result extends Component {
  constructor(props) {
    super(props);

    this.state = {
      activeResult: {},
      computationOutput: {},
      displayTypes: [],
      plotData: [],
      dummyData: [],
    };
  }

  componentDidMount() {
    this.props.getLocalRun(this.props.params.resultId)
      .then((run) => {
        let plotData = [];

        // Checking display type of computation
        const stepsLength = run.pipelineSnapshot.steps.length;
        const displayTypes = run.pipelineSnapshot.steps[stepsLength - 1]
            .computations[0].computation.display;
        this.setState({
          computationOutput: run.pipelineSnapshot.steps[stepsLength - 1]
            .computations[0].computation.output,
          displayTypes,
        });

        if (displayTypes.findIndex(disp => disp.type === 'scatter_plot') > -1) {
          run.results.plots.map(result => (
            result.coordinates.map(val => (
              plotData.push({
                name: result.title,
                x: val.x,
                y: val.y,
              })
            )
          )));
        } else if (displayTypes.findIndex(disp => disp.type === 'box_plot') > -1) {
          run.results.x.map(val => (
            plotData.push(val)
          ));
        } else {
          plotData = run.results;
        }

        this.setState({
          run,
          plotData,
          dummyData: [14, 15, 16, 16, 17, 17, 17, 17, 17, 18, 18, 18, 18, 18, 18, 19,
            19, 19, 20, 20, 20, 20, 20, 20, 21, 21, 22, 23, 24, 24, 29],
        });
      });
  }

  render() {
    const { displayTypes, run } = this.state;

    return (
      <div>
        <Button className="custom" onClick={BrowserHistory.goBack}>
          <Glyphicon glyph="glyphicon glyphicon-arrow-left" />
        </Button>

        <Tabs defaultActiveKey={0} id="uncontrolled-tab-example">
          {run && run.results && displayTypes.map((disp, index) => {
            const title = disp.type.replace('_', ' ').replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
            return (
              <Tab
                key={disp.type}
                eventKey={index}
                title={`${title} View`}
              >
                {disp.type === 'box_plot' &&
                  <Box
                    plotData={this.state.plotData}
                  />
                }
                {disp.type === 'scatter_plot' &&
                  <Scatter
                    plotData={this.state.plotData}
                  />
                }
                {disp.type === 'table' &&
                  <Table
                    computationOutput={this.state.computationOutput}
                    plotData={this.state.plotData}
                    tables={disp.tables ? disp.tables : null}
                  />
                }
              </Tab>
            );
          })}
        </Tabs>

        {run && run.error &&
          <Well style={{ color: 'red' }}>
            {JSON.stringify(run.error.error.error, null, 2)}
          </Well>
        }
      </div>
    );
  }
}

Result.propTypes = {
  getLocalRun: PropTypes.func.isRequired,
  params: PropTypes.object.isRequired,
};

Result.defaultProps = {
  activeResult: null,
};

const mapStateToProps = ({ auth }) => {
  return { auth };
};

export default connect(mapStateToProps, { getLocalRun })(Result);
