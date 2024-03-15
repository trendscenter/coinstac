import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ReactFauxDOM from 'react-faux-dom';

export default () => import('d3').then((d3) => {
  class Scatter extends Component {
    constructor(props) {
      super(props);
      this.drawScatter = this.drawScatter.bind(this);
    }

    drawScatter() {
      const { plotData } = this.props;
      const margin = {
        top: 20, right: 20, bottom: 30, left: 40,
      };
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
        .attr('transform', `translate(${margin.left},${margin.top})`);

      x.domain(d3.extent(plotData, p => p.x)).nice();
      y.domain(d3.extent(plotData, p => p.y)).nice();

      svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', `translate(0,${height})`)
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
        .attr('cx', p => x(p.x))
        .attr('cy', p => y(p.y))
        .style('fill', p => color(p.name));

      const legend = svg.selectAll('.legend')
        .data(color.domain())
        .enter().append('g')
        .attr('class', 'legend')
        .attr('transform', (d, i) => `translate(0,${i * 20})`);

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
        .text(d => d);
      return el.toReact();
    }

    render() {
      return (
        <div id="d3-scatterPlot">
          {this.drawScatter()}
        </div>
      );
    }
  }

  Scatter.propTypes = {
    plotData: PropTypes.array,
  };

  Scatter.defaultProps = {
    plotData: null,
  };
  return Scatter;
});
