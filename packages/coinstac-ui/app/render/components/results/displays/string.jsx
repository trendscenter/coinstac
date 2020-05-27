import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import { remote } from 'electron';

// Get Base App Dir
const dir = remote.getGlobal('config').get('coinstacHome');

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
}

String.propTypes = {
  plotData: PropTypes.object.isRequired,
};

const mapStateToProps = ({ auth }) => ({
  user: auth.user,
});

export default connect(mapStateToProps)(String);
