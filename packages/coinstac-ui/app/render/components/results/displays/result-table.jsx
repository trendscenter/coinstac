import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Table,
} from 'react-bootstrap';

class TableResult extends Component {
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

  makeTable(table, data, outputProps, heading) {
    const tableContents = [];
    if (heading) {
      tableContents.push(<h3 key={heading}>{heading}</h3>);
    }

    if ((table && table.subtables && Array.isArray(data))) {
      data.forEach((d) => {
        tableContents.push(
          this.makeTable(table, d, outputProps, null)
        );
      });
    } else if (table && table.subtables && typeof table.subtables === 'object') {
      table.subtables.forEach(t =>
        tableContents.push(
          this.makeTable(t, data[t.source], outputProps.items[t.source], outputProps.items[t.source].label)
        )
      );
    } else if (table && table.subtables && table.subtables === 'by-key') {
      Object.entries(data).forEach((keyValPair) => {
        tableContents.push(
          this.makeTable(null, keyValPair[1], outputProps, keyValPair[0])
        );
      });
    } else if (!table || (table && !table.subtables)) {
      const keyValPairs = Object.entries(data);
      let keys = [];

      if (Array.isArray(data)) {
        keys = Object.entries(data[0]);
      }

      tableContents.push(
        <Table responsive key={`${heading}-table`}>
          {Array.isArray(data) &&
            <thead>
              {keys.map(key => <th>{key[0]}</th>)}
            </thead>
          }
          <tbody>
            {Array.isArray(data) &&
              data.map((d, index) => {
                return (
                  <tr key={`${index}-row`}>
                    {keys.map(key =>
                    (
                      <td>{d[key[0]]}</td>
                    ))}
                  </tr>
                );
              })
            }
            {!Array.isArray(data) &&
              keyValPairs.map(pair =>
                (
                  <tr key={`${pair[0]}-row`}>
                    <td className="bold">
                      {outputProps ? outputProps.items[pair[0]].label : pair[0]}
                    </td>
                    <td>{pair[1]}</td>
                  </tr>
                )
              )
            }
          </tbody>
        </Table>
      );
    }

    return tableContents;
  }

  render() {
    const { computationOutput, plotData, tables } = this.props;

    return (
      <div>
        {tables && tables.map(t =>
          this.makeTable(
            t,
            plotData[t.source],
            computationOutput[t.source],
            computationOutput[t.source].label
          )
        )}
        {!tables && this.makeTable(null, plotData, null, 'Test Data')}
      </div>
    );
  }
}

TableResult.propTypes = {
  computationOutput: PropTypes.object,
  plotData: PropTypes.array.isRequired,
  tables: PropTypes.array,
};

TableResult.defaultProps = {
  computationOutput: null,
  tables: null,
};

export default TableResult;
