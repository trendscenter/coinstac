import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { notifySuccess, notifyError, writeLog } from '../../../state/ducks/notifyAndLog';
import RasterizeHTML from 'rasterizehtml';
import jsPDF from 'jspdf';
import Button from '@material-ui/core/Button';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import _ from 'lodash';
import kebabcase from 'lodash';

class Iframe extends Component {
  constructor(props) {
    super(props);
    this.state = {
      iFrameHeight: '600px'
    }
  }

  render() {
    const { plotData, classes, path } = this.props;
    return (
       <div>
           <div>
               <iframe
                 style={{width:'100%', height:this.state.iFrameHeight}}
                 src={path}
                 onLoad={() => {
                      const obj = ReactDOM.findDOMNode(this);
                      this.setState({
                          "iFrameHeight":  obj.contentWindow.document.body.scrollHeight + 'px'
                      });
                  }}
                  ref="iframe"
                  width="100%"
                  height={this.state.iFrameHeight}
                  frameBorder="0"
                 >
               </iframe>
           </div>
       </div>
     );
  }
}

Iframe.propTypes = {
  plotData: PropTypes.object,
  notifyError: PropTypes.func.isRequired,
  writeLog: PropTypes.func.isRequired,
  classes: PropTypes.object.isRequired,
};

Iframe.defaultProps = {
  plotData: null,
};

const mapStateToProps = ({ auth: { user } }) => {
  return {
    user,
  };
};

const connectedComponent = connect(mapStateToProps, {
  notifyError,
  writeLog,
})(Iframe);

export default connectedComponent;
