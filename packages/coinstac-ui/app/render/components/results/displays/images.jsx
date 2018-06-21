import React, { Component } from 'react';
import PropTypes from 'prop-types';

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
      if (key.includes('global')) {
        output.push(<span key={`span-global-${key}`}><h2>{this.humanize(key)}</h2><hr /></span>);
      } else {
        output.push(<h2>{this.humanize(key)}</h2>);
      }
      Object.entries(value).forEach(([k, v]) => {
        if (key.includes('global')) {
          output.push(<h3 key={`image-${k}`}>{this.humanize(k).replace('.png', '')}</h3>);
        } else {
          output.push(<span key={`span-${k}`}><hr /><h3 key={`image-${k}`}>{this.humanize(k).replace('.png', '')}</h3></span>);
        }
        if (typeof v === 'string') {
          output.push(<img alt={`${v}-img`} src={`data:image/png;base64, ${v}`} />);
        } else {
          Object.entries(v).forEach(([l, w]) => {
            output.push(<h4 key={`image-${k}-${l}`}>{this.humanize(l).replace('.png', '')}</h4>);
            if (typeof w === 'string') {
              output.push(<img alt={`${w}-img`} src={`data:image/png;base64, ${w}`} />);
            }
          });
        }
      });
    });
    return output;
  }

  render() {
    const { plotData } = this.props;
    return (
      <div id="images">
        {plotData && this.drawImageResults(plotData)}
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
