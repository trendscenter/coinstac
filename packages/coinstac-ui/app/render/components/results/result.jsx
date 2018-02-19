import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Boxplot from 'react-boxplot';
import { ScatterChart } from 'react-d3';
import { Chart, Grid, Xaxis, Yaxis } from 'react-d3-core';
import computeBoxplotStats from 'react-boxplot/dist/stats';
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

        if (run.results.plots) {
          run.results.plots.map(result => (
            plotData.push({
              name: result.title,
              values: result.coordinates,
            })
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
        {(activeResult && activeResult.results && activeResult.results.type === 'scatter_plot') &&
        <ScatterChart
          legend
          data={this.state.plotData}
          width={850}
          height={475}
          xAxisOffset={+20}
          yAxisOffset={-20}
          title={activeResult.title}
        />
      }
        {activeResult && activeResult.results && activeResult.results.type === 'box_plot' &&
          <Chart {...this.props}>
            <Grid type="x" {...this.props} {...this.state} xScale="linear" yScale="linear" />
            <Grid type="y" {...this.props} {...this.state} yScale="linear" xScale="linear" />
            <Boxplot
              className=""
              style={{ paddingLeft: 100 }}
              width={25}
              height={300}
              min={0}
              max={30}
              stats={computeBoxplotStats(this.state.dummyData)}
            />
            <Xaxis
              {...this.props}
              {...this.state}
            />
            <Yaxis
              {...this.props}
              {...this.state}
            />
          </Chart>
        }
        {activeResult && activeResult.results && !activeResult.results.type &&
          <pre>{JSON.stringify(activeResult.results)}</pre>}
      </div>
    );
  }
}

Result.propTypes = {
  activeResult: PropTypes.object,
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
