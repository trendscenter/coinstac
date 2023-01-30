import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactFauxDOM from 'react-faux-dom';

export default () => import('d3').then((d3) => {
  class Box extends Component {
    constructor(props) {
      super(props);
      this.drawBox = this.drawBox.bind(this);
    }

    drawBox() {
      const { plotData } = this.props;
      const widthBox = 960;
      const heightBox = 500;
      const barWidth = 30;
      const margin = {
        top: 20, right: 20, bottom: 30, left: 40,
      };
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
        .attr('transform', `translate(${margin.left},${margin.top})`);
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
        .attr('transform', (d, i) => { return `translate(20,${i * 25})`; });

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
        })
        .attr('y1', (datum) => {
          const whisker = datum.whiskers[0];
          return yScale(whisker);
        })
        .attr('x2', (datum) => {
          return xScale(datum.key) + (barWidth / 2);
        })
        .attr('y2', (datum) => {
          const whisker = datum.whiskers[1];
          return yScale(whisker);
        })
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
        })
        .attr('x', (datum) => {
          return xScale(datum.key);
        })
        .attr('y', (datum) => {
          return yScale(datum.quartile[0]);
        })
        .attr('fill', (datum) => {
          return datum.color;
        })
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

    render() {
      return (
        <div id="d3-scatterPlot">
          {this.drawBox()}
        </div>
      );
    }
  }

  Box.propTypes = {
    plotData: PropTypes.array,
  };

  Box.defaultProps = {
    plotData: null,
  };
  return Box;
});
