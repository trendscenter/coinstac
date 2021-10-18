/* eslint-disable react/no-array-index-key, no-useless-escape */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import { JSONToHTMLTable } from '@kevincobain2000/json-to-html-table';
import { withStyles } from '@material-ui/core/styles';
import uuid from 'uuid/v4'; // eslint-disable-line

const styles = () => ({
  downloadButtonContainer: {
    textAlign: 'right',
  },
  theading: {
    color: 'white',
    fontSize: '0',
  },
});

/**
 * downloadCSV
 * Create a named empty CSV file inject string blob and download
 * @param {string} csv Table values
 * @param {string} filename The name of the file
 */
function downloadCSV(csv, filename) {
  const csvFile = new Blob([csv], { type: 'text/csv' });
  const downloadLink = document.createElement('a');
  downloadLink.download = filename;
  downloadLink.href = window.URL.createObjectURL(csvFile);
  downloadLink.style.display = 'none';
  document.body.appendChild(downloadLink);
  downloadLink.click();
}

/**
 * exportTableToCSV
 * Convert HTML Table to CSV formatted string
 * @param {string} html Table hypertext
 * @param {string} filename The name of the file
 */
function exportTableToCSV(html, filename) {
  const csv = [];
  const rows = document.querySelectorAll('table tr');

  for (let i = 0; i < rows.length; i += 1) {
    const row = [];
    let cols = rows[i].querySelectorAll('th');
    if (cols.length === 0) {
      cols = rows[i].querySelectorAll('td');
    }
    for (let j = 0; j < cols.length; j += 1) {
      row.push(cols[j].innerText);
      if (j === cols.length - 1) {
        csv.push(row.join(','));
      }
    }
  }
  // Download CSV
  downloadCSV(csv.join('\n'), filename);
}

function parseTableColumnOutput(output) {
  if (Array.isArray(output)) {
    const cols = [];
    // eslint-disable-next-line
    output.map((o, ind) => {
      o = parseFloat(o).toFixed(4);
      if (parseFloat(o) === 0) {
        o = 0;
      } else if (Math.abs(o) > 999 || Math.abs(o) < 0.001) {
        o = parseFloat(o).toExponential(4);
      }
      cols.push(
        <td key={`value-${o}-${ind}`}>
          {`${o} `}
        </td>
      );
    });
    return cols;
  } if (!isNaN(output) && typeof output !== 'boolean') { // eslint-disable-line no-restricted-globals
    if (output === 0) {
      output = 0;
    } else if (Math.abs(output) > 999 || Math.abs(output) < 0.001) {
      return parseFloat(output).toExponential(4);
    }
    return output;
  }

  return output;
}

class SimpleTable extends Component {
  /**
   * slugify
   * Converts human readable string to a slug
   * @param  {string} text Input String to Convert
   * @return {string}     Converted String to Slug
   */

  // ignore weird class-methods-use-this lint error
  // eslint-disable-next-line
  slugify(text) {
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/[^\w\-]+/g, '') // Remove all non-word chars
      .replace(/\-\-+/g, '-') // Replace multiple - with single -
      .replace(/^-+/, '') // Trim - from start of text
      .replace(/-+$/, ''); // Trim - from end of text
  }

  /**
   * saveFileCSV
   * OnClick function to convert Table HTML to csv, save, and download file
   * @param {string} filename The name of the file
   */
  saveFileCSV = () => {
    const { title } = this.props;
    const html = document.querySelector('table').outerHTML;
    const filename = this.slugify(title);
    exportTableToCSV(html, `${filename}.csv`);
  }


  render() {
    const {
      clients, computationOutput, plotData, classes,
    } = this.props;

    return (
      <div>
        <div className={classes.downloadButtonContainer}>
          <Button
            variant="contained"
            color="primary"
            onClick={this.saveFileCSV}
          >
            Download to CSV
          </Button>
        </div>
        <JSONToHTMLTable data={plotData} tableClassName="table table-sm" />
      </div>
    );
  }
}

SimpleTable.propTypes = {
  classes: PropTypes.object.isRequired,
  computationOutput: PropTypes.object,
  plotData: PropTypes.object.isRequired,
  title: PropTypes.string,
};

SimpleTable.defaultProps = {
  clients: {},
  computationOutput: null,
  tables: null,
  title: '',
};

export default withStyles(styles)(SimpleTable);
