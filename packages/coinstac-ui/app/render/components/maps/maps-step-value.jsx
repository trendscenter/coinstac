import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { compose, graphql, withApollo } from 'react-apollo';
import { Alert, Button, Panel } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { ipcRenderer } from 'electron';
import PropTypes from 'prop-types';
import { capitalize } from 'lodash';
import dragula from 'react-dragula';

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
      type
    } = this.props;

    return (
      <Panel>
        <div>
          <ul className={"list-inline"}>
            <li><strong>{capitalize(type)}:</strong> {step['value']}</li>
          </ul>
        </div>
      </Panel>
    );
  }
}

MapsStepData.propTypes = {
  step: PropTypes.object.isRequired,
};

export default MapsStepData;
