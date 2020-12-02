import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import { remote } from 'electron';
import { startCase } from 'lodash';

// Get Base App Dir
const dir = remote.getGlobal('config').get('coinstacHome');

const moveLastArrayElementToFirstIndex = ((theArray) => {
  let i;
  let newArray = new Array();
  newArray[0] = theArray[theArray.length-1];
  for (i = 1; i < theArray.length; i++) {
    newArray[i] = theArray[i - 1];
  }
  return newArray;
});

const createTable = (rows) => {
  console.log(rows);
  let table = (
    <table style={{width: 'auto', marginBottom: '1rem' }}>
      <tbody>
        <tr>
          <td colspan="2" style={{ border: 'none' }} />
          <td colspan="2"
            style={{
              background: '#efefef',
              border: '1px solid #ccc',
              textAlign: 'center'
            }}>
              <b>Predicted</b>
            </td>
        </tr>
        <tr>
          <td style={{ border: 'none' }}>&nbsp;</td>
          <td style={{ border: 'none' }}>&nbsp;</td>
          <td style={{ border: '1px solid #ccc' }}><b>False</b></td>
          <td style={{ border: '1px solid #ccc' }}><b>True</b></td>
        </tr>
        <tr>
          <td rowspan="2"
            style={{
              background: '#efefef',
              border: '1px solid #ccc',
            }}><b>Actual</b></td>
          <td style={{ border: '1px solid #ccc' }}><b>False</b></td>
          <td style={{ border: '1px solid #ccc' }}>{rows[0][0]}</td>
          <td style={{ border: '1px solid #ccc' }}>{rows[0][1]}</td>
        </tr>
        <tr>
          <td style={{ border: '1px solid #ccc' }}><b>True</b></td>
          <td style={{ border: '1px solid #ccc' }}>{rows[1][0]}</td>
          <td style={{ border: '1px solid #ccc' }}>{rows[1][1]}</td>
        </tr>
      </tbody>
    </table>
  )
  return table
}

class String extends Component {
  /**
   * humanize
   * Converts underscored lowercase string to human readable Title
   * Also converts 'Beta' to symbol β
   * @param  {string} str Input String to Convert
   * @return {string}     Converted String to Title
   */

  // ignore weird class-methods-use-this lint error
  // eslint-disable-next-line
    componentDidMount = () => {
      setTimeout(this.renderCanvas, 1000);
    }

    render() {
      const { plotData } = this.props;
      if (typeof plotData === 'string') {
        return (
          <div>
            {plotData.message && plotData.display ? (
              <div>
                <p>{plotData.message}</p>
                <p>
                  <img
                    src={`data:image/png;base64, ${plotData.display}`}
                    alt="plot-data-display"
                  />
                </p>
                <Button
                  variant="contained"
                  color="primary"
                  href={`${dir}/${plotData.download_outputs}`}
                >
                Download
                </Button>
              </div>
            ) : <p>{JSON.stringify(plotData)}</p>}
          </div>
        );
      }
      if (typeof plotData === 'object') {
        let result = [];
        Object.entries(plotData).map((item, k) => {
          let key = item[0];
          let v = moveLastArrayElementToFirstIndex(item[1]);
          let type = v[0];
          let val = v[1];
          if (type === 'number') {
            result[k] = (
              <div style={{marginTop: '1rem', marginBottom: '1rem' }}>
                <div style={{marginBottom: '1rem' }}><strong>{startCase(key)}</strong></div>
                <div>{val}</div>
              </div>
            );
          }
          if (type === 'array') {
            result[k] = (
              <div style={{marginTop: '1rem', marginBottom: '1rem' }}>
                <div style={{marginBottom: '1rem' }}><strong>{startCase(key)}</strong></div>
                <div>{JSON.stringify(val)}</div>
              </div>
            );
          }
          if (type === 'table') {
            result[k] = (
              <div style={{marginTop: '1rem', marginBottom: '1rem' }}>
                <div style={{marginBottom: '1rem' }}><strong>{startCase(key)}</strong></div>
                <div>
                  {createTable(val)}
                </div>
              </div>
            );
          }
          if (type === 'tables') {
            result[k] = (
              <div style={{marginTop: '1rem', marginBottom: '1rem' }}>
                <div style={{marginBottom: '1rem' }}><strong>{startCase(key)}</strong></div>
                <div>{
                  val.map((table) => {
                    return createTable(table);
                  })
                }</div>
              </div>
            );
          }
        });
        return result;
      }
    }
}

String.propTypes = {
  plotData: PropTypes.object.isRequired,
};

const mapStateToProps = ({ auth }) => ({
  user: auth.user,
});

export default connect(mapStateToProps)(String);
