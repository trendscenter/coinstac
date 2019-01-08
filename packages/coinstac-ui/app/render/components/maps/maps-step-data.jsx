import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { Panel } from 'react-bootstrap';

class MapsStepData extends Component {

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

    let name = step.type;

    return (
      <Panel className="drop-panel" header={<h3>{step['type']}</h3>}>
        {step &&
        <div>
          <ul className="list-inline">
            <li><strong>Interest(s):</strong></li>
            {step['value'] &&
              step['value'].map((key, i) => {
                return (<li key={key}>{step['value'][i]}</li>)
              })
            }
          </ul>
          <div className="drop-zone">
            {this.props.isMapped === -1 ?
              <div ref='Container' className={`acceptor acceptor-${name}`} data-type={this.props.type} data-name={name} />
              : <div className={"card-draggable"}>
                <span className="glyphicon glyphicon-file" /> {name}</div>}
          </div>
        </div>
        }
      </Panel>
    );
  }
}

MapsStepData.propTypes = {
  step: PropTypes.object.isRequired,
};

export default MapsStepData;
