import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as d3 from 'd3';
import ReactFauxDOM from 'react-faux-dom';

class Table extends Component {
  constructor(props) {
    super(props);
    this.drawTable = this.drawTable.bind(this);
  }
  drawTable() {
    const { plotData } = this.props;
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
          if (d[k].constructor === Array) {
            d[k] = d[k].map((v) => {
              v = parseFloat(v).toFixed(5);
              if (v > 999 || v < 0.001) {
                return parseFloat(v).toExponential(5);
              }
              return v;
            });
          }
          return { value: d[k], name: k };
        });
      }).enter()
      .append('td')
      .attr('data-th', (d) => {
        return d.name;
      })
      .text((d) => {
        return d.value.toString().replace(/,/g, ', ');
      });
    const headers = table.append('thead').append('tr')
    .selectAll('th')
    .data(titles)
    .enter()
    .append('th')
    .text((d, i) => {
      if (i === -1) {
        return ' ';
      }
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
    return (
      <div id="d3-Table">
        {this.drawTable()}
      </div>
    );
  }
}

Table.propTypes = {
  plotData: PropTypes.array,
};

Table.defaultProps = {
  plotData: null,
};

export default Table;

