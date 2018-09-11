import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { notifySuccess, notifyError, writeLog } from '../../../state/ducks/notifyAndLog';
import RasterizeHTML from 'rasterizehtml';
import jsPDF from 'jspdf';
import { Button } from 'react-bootstrap';
import _ from 'lodash';
import kebabcase from 'lodash.kebabcase';

const styles = {
  print: { display: 'none', visibility: 'hidden' },
  column: { position: 'relative', float: 'left', width: '45%', marginRight: '5%' },
  image: { width: '100%', height: 'auto' },
  pdfButton: { position: 'absolute', top: '20rem', right: '2rem' },
  page: { position: 'relative', float: 'left', width: '95%', marginRight: '5%' },
  subItem: { position: 'relative', float: 'left', width: '95%', marginRight: '5%' },
  subpage: { position: 'relative', float: 'left', width: '100%', marginBottom: '2rem' },
};

class Images extends Component {
  constructor(props) {
    super(props);
    this.drawImageResults = this.drawImageResults.bind(this);
  }

  /**
   * humanize
   * Converts underscored lowercase string to human readable Title
   * Also converts 'Beta' to symbol β
   * @param  {string} str Input String to Convert
   * @return {string}     Converted String to Title
   */

   // ignore weird class-methods-use-this lint error
   // eslint-disable-next-line
    humanize(str) {
      const frags = str.split('_');
      for (let i = 0; i < frags.length; i += 1) {
        frags[i] = frags[i].charAt(0).toUpperCase() + frags[i].slice(1);
      }
      let string = frags.join(' ');
      string = string.replace('Beta', 'β ');
      return string;
    }

  /**
   * drawImageResults
   * Takes computation Result Object and displays list of Images
   * @param  {Object} obj Result Object
   * @return {Object}     JSX of Global and Local Results with Images
   */

  drawImageResults(obj) {
    const output = [];
    Object.entries(obj).forEach(([key, value]) => {
      const page = [];
      const subitem = [];
      const col1 = [];
      const col2 = [];
      let subcol1 = [];
      let subcol2 = [];
      if (key.includes('global')) {
        page.push(
          <span key={`span-global-${key}`}><h2>{this.humanize(key)}</h2>
          <hr /></span>);
      }
      Object.entries(value).forEach(([k, v], i) => {
        let itemsLength = Object.entries(value).length;
        let item = [];
        if (key.includes('global')) {
          item.push(
            <h4 key={`image-${k}`}>{this.humanize(k).replace('.png', '')}</h4>
          );
        } else {
          item.push(
            <span key={`span-${k}`}>
              <h2 key={`image-${k}`}>
                Local Stats - {this.humanize(k).replace('.png', '')}
              </h2><hr />
            </span>
          );
        }
        if (typeof v === 'string') {
          item.push(
            <img key={`${v}-img`} alt={`${v}-img`} src={`data:image/png;base64, ${v}`}
            style={styles.image} />
          );
        } else {
          Object.entries(v).forEach(([l, w], h) => {
            let subItemsLength = Object.entries(v).length;
            const subitem = [];
            subitem.push(
              <h4 key={`image-${k}-${l}`}>{this.humanize(l).replace('.png', '')}
              </h4>
            );
            if (typeof w === 'string') {
              subitem.push(
                <img alt={`${w}-img`} alt={`${w}-img`} src={`data:image/png;base64, ${w}`}
                  style={styles.image} />
              );
            }
            if (h + 1 <= subItemsLength/2 && subcol1.length < subItemsLength/2) {
              subcol1.push(
                <div className={'item'} key={`image-sub1-${key}-${k}-${l}`} style={styles.imgItem}>{subitem}</div>
              );
            }
            if (h + 1 > subItemsLength/2  && subcol2.length < subItemsLength/2) {
              subcol2.push(
                <div className={'item'} key={`image-sub2-${key}-${k}-${l}`} style={styles.imgItem}>{subitem}</div>
              );
            }
          });
        };
        if (key.includes('global')) {
          if (i + 1 <= itemsLength/2) {
            col1.push(
              <div className={'item'} key={`page-${key}-${k}`} style={styles.imgItem}>{item}</div>
            );
          }
          if (i + 1 > itemsLength/2) {
            col2.push(
              <div className={'item'} key={`page-${key}-${k}`} style={styles.imgItem}>{item}</div>
            );
          }
        }else{
          page.push(
            <div className={`page-${k}`} ref={`page-${k}`} key={`page-${k}`} style={styles.subpage}>
              {item}
              <div style={styles.column}>{subcol1}</div>
              <div style={styles.column}>{subcol2}</div>
            </div>
          );
          subcol1 = [];
          subcol2 = [];
        }
      });
      page.push(
        <div style={styles.column}>{col1}</div>
      );
      page.push(
        <div style={styles.column}>{col2}</div>
      );
      if (key.includes('global')) {
        output.push(
          <div key={`page-${key}`} className={`page-${key}`} ref={'global_page'} style={styles.page}>{page}</div>
        );
      }else{
        output.push(
          <div key={`page-${key}`} className={'local_stats'} ref={`local_page_${key}`} style={styles.page}>{page}</div>
        );
      }
    });
    return output;
  }

  renderCanvas = () => {
    const { plotData } = this.props;
    let global_canvas = ReactDOM.findDOMNode(this.refs.global_canvas);
    let global_results = ReactDOM.findDOMNode(this.refs.global_page);
    RasterizeHTML.drawHTML(global_results.innerHTML, global_canvas);
    Object.entries(plotData.local_stats).forEach(([key, value]) => {
        let canvas = key + '_canvas';
        let page = 'page-' + key;
        let key_canvas = ReactDOM.findDOMNode(this.refs[canvas]);
        let key_results = ReactDOM.findDOMNode(this.refs[page]);
        RasterizeHTML.drawHTML(key_results.innerHTML, key_canvas);
    });
  }

  componentDidMount = () => {
    setTimeout(this.renderCanvas, 1000);
  }

  savePDF = () => {
     const { plotData } = this.props;
     let canvas = ReactDOM.findDOMNode(this.refs.global_canvas);
		 try {
			canvas.getContext('2d');
		  let doc = new jsPDF();
      let globalImg = canvas.toDataURL("image/jpg", 1.0);
      let global_items = Object.keys(plotData.global_stats).length;
      let height = 0;
      height = global_items * 25;
		  doc.addImage(globalImg, 'jpg', 5, 5, 200, height);
      Object.entries(plotData.local_stats).forEach(([key, value]) => {
          let canvas = key + '_canvas';
          let page = 'page-' + key;
          let key_canvas = ReactDOM.findDOMNode(this.refs[canvas]);
          let canvasImg = key_canvas.toDataURL("image/jpg", 1.0);
          doc.addPage();
    		  doc.addImage(canvasImg, 'jpg', 5, 5, 200, height);
      });
		  doc.save(kebabcase(this.props.title) + ".pdf");
    } catch(err) {
     this.props.writeLog({ type: 'error', message: err });
     this.props.notifyError({
       message: err
     });
	 }
	}

  render() {
    const { plotData } = this.props;
    let global_items = Object.keys(plotData.global_stats).length;
    let local_items = Object.keys(plotData.local_stats).length;
    let height = 0;
    height = global_items * 105;
    let local_canvas = [];
    Object.entries(plotData.local_stats).forEach(([key, value]) => {
        local_canvas.push(<canvas className={'canvas'} ref={`${key}_canvas`} width="800" height={height}></canvas>);
    });
    return (
      <div>
        <Button
          bsStyle="primary"
          onClick={this.savePDF}
          style={styles.pdfButton}>
          Download as pdf
        </Button>
        <div id="images" ref="results">
          {plotData && this.drawImageResults(plotData)}
        </div>
        <div style={styles.print}>
          <canvas ref="global_canvas" width="800" height={height}></canvas>
          {local_canvas}
        </div>
      </div>
    );
  }
}

Images.propTypes = {
  plotData: PropTypes.object,
  notifyError: PropTypes.func.isRequired,
  writeLog: PropTypes.func.isRequired,
};

Images.defaultProps = {
  plotData: null,
};

const mapStateToProps = ({ auth: { user } }) => {
  return {
    user,
  };
};

export default connect(mapStateToProps, {
  notifyError,
  writeLog,
})(Images);
