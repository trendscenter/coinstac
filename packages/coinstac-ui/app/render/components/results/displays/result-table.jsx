import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Table,
} from 'react-bootstrap';


function parseTableColumnOutput(output) {
  if (Array.isArray(output)) {
    output = output.map(o => parseTableColumnOutput(o));
    return output.join(', ');
  } else if (!isNaN(output) && typeof output !== 'boolean') {
    output = parseFloat(output).toFixed(5);
    if (output > 999 || output < 0.001) {
      return parseFloat(output).toExponential(5);
    }
    return output;
  }

  return output;
}

class TableResult extends Component {
  makeTable(table, data, outputProps, heading, marginLeft) {
    const tableContents = [];
    if (heading) {
      tableContents.push(
        <h3 style={{ marginLeft }} key={heading}>{heading}</h3>
      );
    }

    if ((table && table.subtables && Array.isArray(data))) {
      data.forEach((d) => {
        tableContents.push(
          this.makeTable(table, d, outputProps, null, marginLeft + 10)
        );
        tableContents.push(<hr style={{ borderTop: '1px solid black' }} />);
      });
    } else if (table && table.subtables && typeof table.subtables === 'object') {
      table.subtables.forEach((t) => {
        let heading = outputProps.items[t.source].label;

        if (t.subtitle) {
          heading += ` -- ${data[t.subtitle]}`;
        }

        tableContents.push(
          this.makeTable(
            t,
            data[t.source],
            outputProps.items[t.source],
            heading,
            marginLeft + 10
          )
        );
      });
    } else if (table && table.subtables && table.subtables === 'by-key') {
      Object.entries(data).forEach((keyValPair) => {
        tableContents.push(
          this.makeTable(
            null,
            keyValPair[1],
            outputProps,
            keyValPair[0],
            marginLeft + 10
          )
        );
      });
    } else if (!table || (table && !table.subtables)) {
      const keyValPairs = Object.entries(data);
      let keys = [];

      if (Array.isArray(data)) {
        keys = Object.entries(data[0]);
      }

      tableContents.push(
        <Table
          responsive
          bordered
          condensed
          key={`${heading}-table`}
          style={{ marginLeft, width: '60%' }}
        >
          {Array.isArray(data) &&
            <thead>
              <tr>
                {keys.map(key => <th key={`${key[0]}-heading`}>{key[0]}</th>)}
              </tr>
            </thead>
          }
          <tbody>
            {Array.isArray(data) &&
              data.map((d, index) => {
                return (
                  <tr key={`${index}-row`}>
                    {keys.map(key =>
                    (
                      <td style={{ fontFamily: 'Courier' }} key={`${key[0]}-column`}>
                        {parseTableColumnOutput(d[key[0]])}
                      </td>
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
                    <td style={{ fontFamily: 'Courier' }}>
                      {parseTableColumnOutput(pair[1])}
                    </td>
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
            computationOutput[t.source].label,
            5
          )
        )}
        {!tables && this.makeTable(null, plotData.testData, null, 'Test Data', 5)}
      </div>
    );
  }
}

TableResult.propTypes = {
  computationOutput: PropTypes.object,
  plotData: PropTypes.object.isRequired,
  tables: PropTypes.array,
};

TableResult.defaultProps = {
  computationOutput: null,
  tables: null,
};

export default TableResult;
