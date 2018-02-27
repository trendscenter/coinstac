import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import * as d3 from 'd3';
import ReactFauxDOM from 'react-faux-dom';
import { getLocalRun } from '../../state/ducks/runs';

class Result extends Component {
  constructor(props) {
    super(props);

    this.state = {
      activeResult: {},
      plotData: [],
      dummyData: [],
    };

    this.drawScatter = this.drawScatter.bind(this);
    this.drawBoxPlot = this.drawBoxPlot.bind(this);
    this.drawTable = this.drawTable.bind(this);
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

  drawScatter() {
    const { plotData } = this.state;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const width = 960 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const el = new ReactFauxDOM.Element('div');
    el.setAttribute('ref', 'chart');
    const x = d3.scaleLinear()
      .range([0, width]);

    const y = d3.scaleLinear()
      .range([height, 0]);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const xAxis = d3.axisBottom()
      .scale(x);

    const yAxis = d3.axisLeft()
      .scale(y);

    const svg = d3.select(el).append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
    .append('g')
      .attr('transform', `translate(${  margin.left  },${  margin.top  })`);

    x.domain(d3.extent(plotData, (p) => { return p.x; })).nice();
    y.domain(d3.extent(plotData, (p) => { return p.y; })).nice();

    svg.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + height + ')')
      .call(xAxis)
    .append('text')
      .attr('class', 'label')
      .attr('fill', 'black')
      .style('font-size', '8pt')
      .attr('x', width)
      .attr('y', -6)
      .style('text-anchor', 'end')
      .text('X-Axis Label');

    svg.append('g')
      .attr('class', 'y axis')
      .call(yAxis)
    .append('text')
      .attr('class', 'label')
      .attr('fill', 'black')
      .style('font-size', '8pt')
      .attr('transform', 'rotate(-90)')
      .attr('y', 6)
      .attr('dy', '.71em')
      .style('text-anchor', 'end')
      .text('Y-Axis Label');

    svg.selectAll('.dot')
    .data(plotData)
    .enter().append('circle')
    .attr('class', 'dot')
    .attr('r', 4.5)
    .attr('cx', (p) => { return x(p.x); })
    .attr('cy', (p) => { return y(p.y); })
    .style('fill', (p) => { return color(p.name); });

    const legend = svg.selectAll('.legend')
      .data(color.domain())
    .enter().append('g')
      .attr('class', 'legend')
      .attr('transform', (d, i) => { return 'translate(0,' + i * 20 + ')'; });

    legend.append('rect')
      .attr('x', width - 18)
      .attr('width', 18)
      .attr('height', 18)
      .style('fill', color);

    legend.append('text')
      .attr('x', width - 24)
      .attr('y', 9)
      .attr('dy', '.35em')
      .style('text-anchor', 'end')
      .text((d) => { return d; });
    return el.toReact();
  }

  drawBoxPlot() {
    const { plotData } = this.state;
    const widthBox = 960;
    const heightBox = 500;
    const barWidth = 30;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const width = widthBox - margin.left - margin.right;
    const height = heightBox - margin.top - margin.bottom;
    const totalWidth = width + margin.left + margin.right;
    const totalheight = height + margin.top + margin.bottom;
    const el = new ReactFauxDOM.Element('div');
    el.setAttribute('ref', 'chart');
    // Generate five 100 count, normal distributions with random means
    const groupCounts = {};
    const globalCounts = [];
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Perform a numeric sort on an array
    function sortNumber(a, b) {
      return a - b;
    }

    function boxQuartiles(d) {
      return [
        d3.quantile(d, 0.25),
        d3.quantile(d, 0.5),
        d3.quantile(d, 0.75)];
    }
    // Sort group counts so quantile methods work
    Object.values(plotData).forEach((val) => {
      val.values.sort(sortNumber);
      val.values.forEach(x => (
        globalCounts.push(x)
      ));
    });
    // Setup a color scale for filling each box
    // Prepare the data for the box plots
    const boxPlotData = [];
    Object.entries(plotData).forEach((val, key) => {
      const record = {};
      const localMin = d3.min(val[1].values);
      const localMax = d3.max(val[1].values);
      groupCounts[key] = val[1].values;
      record.key = key;
      record.counts = val[1].values;
      record.quartile = boxQuartiles(val[1].values);
      record.whiskers = [localMin, localMax];
      record.color = color(val[1].label);
      boxPlotData.push(record);
    });
    // Compute an ordinal xScale for the keys in boxPlotData
    const xScale = d3.scalePoint()
      .domain(Object.keys(groupCounts))
      .rangeRound([0, width])
      .padding([0.5]);
    // Compute a global y scale based on the global counts
    const min = d3.min(globalCounts);
    const max = d3.max(globalCounts);
    const yScale = d3.scaleLinear()
      .domain([min, max])
      .range([0, height]);
    // Setup the svg and group we will draw the box plot in
    const svg = d3.select(el).append('svg')
      .attr('width', totalWidth)
      .attr('height', totalheight)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    // Move the left axis over 25 pixels, and the top axis over 35 pixels
    const axisG = svg.append('g').attr('transform', 'translate(25,0)');
    const axisTopG = svg.append('g').attr('transform', 'translate(35,0)');
    // Setup the group the box plot elements will render in
    const g = svg.append('g')
      .attr('transform', 'translate(20,5)');
    // Draw legend
    const legend = svg.selectAll('.legend')
      .data(color.domain())
    .enter().append('g')
      .attr('class', 'legend')
      .attr('transform', (d, i) => { return 'translate(20,' + i * 25 + ')'; });

    legend.append('rect')
      .attr('x', width - 18)
      .attr('width', 18)
      .attr('height', 18)
      .style('fill', color);

    legend.append('text')
      .attr('x', width - 24)
      .attr('y', 9)
      .attr('dy', '.35em')
      .style('text-anchor', 'end')
      .text((d) => { return d; });
    // Draw the box plot vertical lines
    g.selectAll('.verticalLines')
      .data(boxPlotData)
      .enter()
      .append('line')
      .attr('x1', (datum) => {
        return xScale(datum.key) + (barWidth / 2);
      }
      )
      .attr('y1', (datum) => {
        const whisker = datum.whiskers[0];
        return yScale(whisker);
      }
      )
      .attr('x2', (datum) => {
        return xScale(datum.key) + (barWidth / 2);
      }
      )
      .attr('y2', (datum) => {
        const whisker = datum.whiskers[1];
        return yScale(whisker);
      }
      )
      .attr('stroke', '#000')
      .attr('stroke-width', 1)
      .attr('fill', 'none');
    // Draw the boxes of the box plot, filled in white and on top of vertical lines
    g.selectAll('rect')
      .data(boxPlotData)
      .enter()
      .append('rect')
      .attr('width', barWidth)
      .attr('height', (datum) => {
        const quartiles = datum.quartile;
        const height = yScale(quartiles[2]) - yScale(quartiles[0]);
        return height;
      }
      )
      .attr('x', (datum) => {
        return xScale(datum.key);
      }
      )
      .attr('y', (datum) => {
        return yScale(datum.quartile[0]);
      }
      )
      .attr('fill', (datum) => {
        return datum.color;
      }
      )
      .attr('stroke', '#000')
      .attr('stroke-width', 1);
    // Now render all the horizontal lines at once - the whiskers and the median
    const horizontalLineConfigs = [
      // Top whisker
      {
        x1: (datum) => { return xScale(datum.key); },
        y1: (datum) => { return yScale(datum.whiskers[0]); },
        x2: (datum) => { return xScale(datum.key) + barWidth; },
        y2: (datum) => { return yScale(datum.whiskers[0]); },
      },
      // Median line
      {
        x1: (datum) => { return xScale(datum.key); },
        y1: (datum) => { return yScale(datum.quartile[1]); },
        x2: (datum) => { return xScale(datum.key) + barWidth; },
        y2: (datum) => { return yScale(datum.quartile[1]); },
      },
      // Bottom whisker
      {
        x1: (datum) => { return xScale(datum.key); },
        y1: (datum) => { return yScale(datum.whiskers[1]); },
        x2: (datum) => { return xScale(datum.key) + barWidth; },
        y2: (datum) => { return yScale(datum.whiskers[1]); },
      },
    ];
    for (let i = 0; i < horizontalLineConfigs.length; i += 1) {
      const lineConfig = horizontalLineConfigs[i];
      // Draw the whiskers at the min for this series
      g.selectAll('.whiskers')
        .data(boxPlotData)
        .enter()
        .append('line')
        .attr('x1', lineConfig.x1)
        .attr('y1', lineConfig.y1)
        .attr('x2', lineConfig.x2)
        .attr('y2', lineConfig.y2)
        .attr('stroke', '#000')
        .attr('stroke-width', 1)
        .attr('fill', 'none');
    }
    // Setup a scale on the left
    const axisLeft = d3.axisLeft(yScale);
    axisG.append('g')
      .call(axisLeft);
    // Setup a series axis on the top
    const axisTop = d3.axisTop(xScale);
    axisTopG.append('g')
      .call(axisTop);

    return el.toReact();
  }

  drawTable() {
    const { plotData } = this.state;
    let sortAscending = true;
    const el = new ReactFauxDOM.Element('div');
    el.setAttribute('ref', 'chart');
    const table = d3.select(el).append('table');
    const titles = d3.keys(plotData[0]);
    const rows = table.append('tbody').selectAll('tr')
      .data(plotData).enter()
      .append('tr');
    rows.selectAll('td')
      .data((d) => {
        return titles.map((k) => {
          return { value: d[k], name: k };
        });
      }).enter()
      .append('td')
      .attr('data-th', (d) => {
        return d.name;
      })
      .text((d) => {
        return d.value;
      });
    const headers = table.append('thead').append('tr')
    .selectAll('th')
    .data(titles)
    .enter()
    .append('th')
    .text((d) => {
      return d;
    })
    .on('click', (d) => {
      headers.attr('class', 'header');
      if (sortAscending) {
        rows.sort((a, b) => { return b[d] < a[d]; });
        sortAscending = false;
        this.className = 'aes';
      } else {
        rows.sort((a, b) => { return b[d] > a[d]; });
        sortAscending = true;
        this.className = 'des';
      }
    });
    return el.toReact();
  }

  render() {
    const { activeResult } = this.state;
    return (
      <div>
        {(activeResult && activeResult.results && activeResult.results.type === 'box_plot') &&
        <div id="d3-boxPlot">
          {this.drawBoxPlot()}
        </div>
      }
        {activeResult && activeResult.results && activeResult.results.type === 'scatter_plot' &&
          <div id="d3-scatterPlot">
            {this.drawScatter()}
          </div>
        }
        {activeResult && activeResult.results && !activeResult.results.type &&
          <div id="d3-table">
            {this.drawTable()}
          </div>
        }
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
