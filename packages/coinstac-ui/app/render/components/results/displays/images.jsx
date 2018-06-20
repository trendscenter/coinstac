import React, { Component } from 'react';
import ReactDOMServer from 'react-dom/server';
import PropTypes from 'prop-types';

class Images extends Component {
  constructor(props) {
    super(props);
    this.drawImageResults = this.drawImageResults.bind(this);
  }

  humanize = (str) => {
    var frags = str.split('_');
    for (var i=0; i<frags.length; i++) {
      frags[i] = frags[i].charAt(0).toUpperCase() + frags[i].slice(1);
    }
    var string = frags.join(' ');
    string = string.replace('Beta','β ');
    return string;
  }

  drawImageResults = (obj) => {
    //console.log(plotData);
    var output = [];
    for (const [key, value] of Object.entries(obj)) {
      if( key.includes('global') ){
        output.push(<span><h2>{this.humanize(key)}</h2><hr /></span>);
      }else{
        output.push(<h2>{this.humanize(key)}</h2>);
      }
      for (const [k, v] of Object.entries(value)) {
        if( key.includes('global') ){
          output.push(<h3 key={`image-${k}`}>{this.humanize(k).replace('.png','')}</h3>);
        }else{
          output.push(<span><hr /><h3 key={`image-${k}`}>{this.humanize(k).replace('.png','')}</h3></span>);
        }
        if(typeof v === 'string'){
          output.push(<img src={`data:image/png;base64,${v}`} />);
        }else{
          for (const [l, w] of Object.entries(v)) {
            console.log(l);
            output.push(<h4 key={`image-${k}-${l}`}>{this.humanize(l).replace('.png','')}</h4>);
            if(typeof w === 'string'){
              output.push(<img src={`data:image/png;base64,${w}`} />);
            }
          }
        }
      }
    }
    return output;
  }

  render() {
    const { computationOutput, plotData } = this.props;
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

export default Images;
