import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { Panel } from 'react-bootstrap';

class MapsStepCovariate extends Component {

  constructor(props) {
    super(props);
  }

  componentDidUpdate() {
    if(this.refs.Container){
      let Container = ReactDOM.findDOMNode(this.refs.Container);
      this.props.getContainers(Container);
    }
  }

  render() {
    const {
      step,
      type,
      update
    } = this.props;

    let name = step.name;

    return (
      <Panel className="drop-panel" header={<h3>{name}</h3>}>
        <ul className="list-inline">
          <li><strong>Source:</strong> {step['source']}</li>
          <li><strong>Type:</strong> {step['type']}</li>
        </ul>
        <div className="drop-zone">
          {this.props.isMapped === -1 ?
            <div ref='Container' className={`acceptor acceptor-${name}`} data-type={this.props.type} data-name={name} />
            : <div className={"card-draggable"}>
              <span className="glyphicon glyphicon-file" /> {name}</div>}
        </div>
      </Panel>
    );
  }
}

MapsStepCovariate.propTypes = {
  step: PropTypes.object.isRequired,
};

export default MapsStepCovariate;
