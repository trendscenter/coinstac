import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import RasterizeHTML from 'rasterizehtml';
import jsPDF from 'jspdf';
import { Button } from 'react-bootstrap';

const styles = {
  print: { display: 'none', visibility: 'hidden' },
  imgItem: { position: 'relative', float: 'left', width: '45%', marginRight: '5%' },
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
     * slugify
     * Converts human readable string to a slug
     * @param  {string} text Input String to Convert
     * @return {string}     Converted String to Slug
     */

     // ignore weird class-methods-use-this lint error
     // eslint-disable-next-line
    slugify(text) {
      return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
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
      if (key.includes('global')) {
        page.push(
          <span key={`span-global-${key}`}><h2>{this.humanize(key)}</h2>
          <hr /></span>);
      }
      Object.entries(value).forEach(([k, v]) => {
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
            <img alt={`${v}-img`} src={`data:image/png;base64, ${v}`}
            style={styles.image} />
          );
        } else {
          Object.entries(v).forEach(([l, w]) => {
            let subitem = [];
            subitem.push(
              <h4 key={`image-${k}-${l}`}>{this.humanize(l).replace('.png', '')}
              </h4>
            );
            if (typeof w === 'string') {
              subitem.push(
                <img alt={`${w}-img`} src={`data:image/png;base64, ${w}`}
                  style={styles.image} />
              );
            }
            item.push(
              <div className={'item'} key={`image-item-${key}-${k}-${l}`} style={styles.imgItem}>{subitem}</div>
            );
          });
        }
        if (key.includes('global')) {
          page.push(
            <div className={'item'} key={`page-${key}-${k}`} style={styles.imgItem}>{item}</div>
          );
        }else{
          page.push(
            <div className={`page-${k}`} ref={`page-${k}`} key={`page-${k}`} style={styles.subpage}>{item}</div>
          );
        }
      });
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
  		  doc.save(this.slugify(this.props.title) + ".pdf");
  		 } catch(e) {
  			 alert("Error description: " + e.message);
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
};

Images.defaultProps = {
  plotData: null,
};

export default Images;
