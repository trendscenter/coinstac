import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Button, Glyphicon, Tabs, Tab } from 'react-bootstrap';
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
      plotData: [],
      dummyData: [],
    };
  }

  componentDidMount() {
    this.props.getLocalRun(this.props.params.resultId)
      .then((run) => {
        const plotData = [];
        if (run.pipelineSnapshot) {
          // Checking display type of computation
          plotData.push(run.results);
        }
        if (run.results.type === 'scatter_plot') {
          run.results.plots.map(result => (
            result.coordinates.map(val => (
              plotData.push({
                name: result.title,
                x: val.x,
                y: val.y,
              })
            )
          )));
        } else if (run.results.type === 'box_plot') {
          run.results.x.map(val => (
            plotData.push(val)
          ));
        }
        this.setState({
          activeResult: run,
          plotData,
          dummyData: [14, 15, 16, 16, 17, 17, 17, 17, 17, 18, 18, 18, 18, 18, 18, 19,
            19, 19, 20, 20, 20, 20, 20, 20, 21, 21, 22, 23, 24, 24, 29],
        });
      });
  }

  render() {
    const { activeResult } = this.state;
    return (
      <div>
        <Button className="custom" onClick={BrowserHistory.goBack}>
          <Glyphicon glyph="glyphicon glyphicon-arrow-left" />
        </Button>
        {(activeResult && activeResult.results && activeResult.results.type === 'box_plot') &&
          <Tabs defaultActiveKey={1} id="uncontrolled-tab-example">
            <Tab eventKey={1} title="Box-Plot View">
              <Box
                plotData={this.state.plotData}
              />
            </Tab>
            <Tab eventKey={2} title="Table View">
              <Table
                plotData={this.state.plotData}
              />
            </Tab>
          </Tabs>
      }
        {activeResult && activeResult.results && activeResult.results.type === 'scatter_plot' &&
          <Tabs defaultActiveKey={1} id="uncontrolled-tab-example">
            <Tab eventKey={1} title="Scatter-Plot View">
              <Scatter
                plotData={this.state.plotData}
              />
            </Tab>
            <Tab eventKey={2} title="Table View">
              <Table
                plotData={this.state.plotData}
              />
            </Tab>
          </Tabs>
        }
        {activeResult && activeResult.results && !activeResult.results.type &&
          <Table
            plotData={this.state.plotData}
          />
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
