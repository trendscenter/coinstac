import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Boxplot from 'react-boxplot';
import { ScatterChart } from 'react-d3';
import { Chart, Grid, Xaxis, Yaxis } from 'react-d3-core';
import computeBoxplotStats from 'react-boxplot/dist/stats';
import { graphql, compose } from 'react-apollo';
import {
  FETCH_ALL_RESULTS_QUERY,
  FETCH_RESULT_QUERY,
  RESULT_CHANGED_SUBSCRIPTION,
} from '../../state/graphql/functions';
import {
  getAllAndSubProp,
  getSelectAndSubProp,
} from '../../state/graphql/props';

class Result extends Component {
  constructor(props) {
    super(props);

    this.state = {
      plotData: [],
      dummyData: [14, 15, 16, 16, 17, 17, 17, 17, 17, 18, 18, 18, 18, 18, 18, 19,
        19, 19, 20, 20, 20, 20, 20, 20, 21, 21, 22, 23, 24, 24, 29],
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.activeResult && !this.state.unsubscribeResults) {
      if (nextProps.activeResult.results.plots) {
        nextProps.activeResult.results.plots.map(result => (
          this.state.plotData.push({
            name: result.title,
            values: result.coordinates,
          })
        ));
      } else if (nextProps.activeResult.results.type === 'box_plot') {
          /*
        nextProps.activeResult.results.x.map(result => (
          this.state.plotData.push({
            values: result.values,
            name: result.label,
          })
        )); */
      }
      this.setState({
        unsubscribeResults: this.props.subscribeToResults(this.state.activeResult),
      });
    }
  }

  componentWillUnmount() {
    if (this.state.unsubscribeResults) {
      this.state.unsubscribeResults();
    }
  }

  render() {
    const { activeResult } = this.props;
    return (
      <div>
        {(activeResult && activeResult.results.type === 'scatter_plot') &&
        <ScatterChart
          legend={true}
          data={this.state.plotData}
          width={850}
          height={475}
          xAxisOffset={+20}
          yAxisOffset={-20}
          title={activeResult.title}
        />
      }
        {activeResult && activeResult.results.type === 'box_plot' &&
          <Chart {...this.props}>
            <Grid type="x" {...this.props} {...this.state} xScale="linear" yScale="linear" />
            <Grid type="y" {...this.props} {...this.state} yScale="linear" xScale="linear" />
            <Boxplot
              className=''
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
      </div>
    );
  }
}

Result.propTypes = {
  activeResult: PropTypes.object,
  subscribeToResults: PropTypes.func.isRequired,
};

Result.defaultProps = {
  activeResult: null,
};

const mapStateToProps = ({ auth }) => {
  return { auth };
};

const ResultsWithData = compose(
  graphql(FETCH_ALL_RESULTS_QUERY, getAllAndSubProp(
    RESULT_CHANGED_SUBSCRIPTION,
    'results',
    'fetchAllResults',
    'subscribeToResults',
    'resultChanged'
  )),
  graphql(FETCH_RESULT_QUERY, getSelectAndSubProp(
    'activeResult',
    RESULT_CHANGED_SUBSCRIPTION,
    'resultId',
    'subscribeToResults',
    'resultChanged',
    'fetchResult'
  ))
)(Result);

export default connect(mapStateToProps)(ResultsWithData);
