import React, { Component } from 'react';
import { compose } from 'redux';
import { DragDropContext, DropTarget } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import PropTypes from 'prop-types';
import shortid from 'shortid';
import { Button } from 'react-bootstrap';
import Controller from './pipeline-controller';
import ItemTypes from './pipeline-item-types';

const newController = () => (
  {
    id: shortid.generate(),
    options: {
      iterations: Math.floor(Math.random() * 10) + 1,
    },
    computations: [],
  }
);

const newComputation = () => (
  {
    id: shortid.generate(),
    meta: {
      name: shortid.generate(),
    },
  }
);

const consortiumTarget = {
  drop() {
  },
};

const collect = (connect, monitor) => (
  {
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
  }
);

class ConsortiumPipeline extends Component {
  constructor(props) {
    super(props);

    this.state = {
      pipeline: {
        controllers: [
          newController(),
        ],
      },
    };

    this.addComputation = this.addComputation.bind(this);
    this.addController = this.addController.bind(this);
    this.moveComputation = this.moveComputation.bind(this);
    this.moveController = this.moveController.bind(this);
  }

  addController() {
    this.setState({
      pipeline: {
        ...this.state.pipeline,
        controllers: [
          ...this.state.pipeline.controllers,
          newController(),
        ],
      },
    });
  }

  addComputation(controllerIndex) {
    const controllers = this.state.pipeline.controllers;
    controllers[controllerIndex].computations.push(newComputation());

    this.setState({
      pipeline: {
        ...this.state.pipeline,
        controllers,
      },
    });
  }

  moveComputation(fromId, toId, fromController, toController) {
    let index;
    const controllers = [...this.state.pipeline.controllers];
    const computation = this.state.pipeline.controllers[fromController].computations
      .find(c => c.id === fromId);

    if (toId !== null) {
      index = this.state.pipeline.controllers[toController].computations
        .findIndex(c => c.id === toId);
    } else {
      index = this.state.pipeline.controllers[fromController].computations
        .findIndex(c => c.id === fromId);
    }

    controllers[fromController].computations = controllers[fromController].computations
      .filter(c => c.id !== fromId);
    controllers[toController].computations.splice(index, 0, computation);

    this.setState({
      pipeline: {
        ...this.state.pipeline,
        controllers,
      },
    });
  }

  moveController(id, swapId) {
    let index;
    const controller = this.state.pipeline.controllers.find(c => c.id === id);

    if (swapId !== null) {
      index = this.state.pipeline.controllers.findIndex(c => c.id === swapId);
    } else {
      index = this.state.pipeline.controllers.findIndex(c => c.id === id);
    }

    const newArr = this.state.pipeline.controllers.filter(c => c.id !== id);
    newArr.splice(index, 0, controller);

    this.setState({
      pipeline: {
        ...this.state.pipeline,
        controllers: newArr,
      },
    });
  }

  render() {
    const { connectDropTarget } = this.props;

    return connectDropTarget(
      <div>
        <Button
          bsStyle="primary"
          type="button"
          onClick={this.addController}
        >
          <span aria-hidden="true" className="glphicon glyphicon-plus" />
          {' '}
          Add Controller
        </Button>

        {this.state.pipeline.controllers.map((controller, index) => (
          <Controller
            id={controller.id}
            key={controller.id}
            controller={controller}
            controllerIndex={index}
            addComputation={this.addComputation}
            moveComputation={this.moveComputation}
            moveController={this.moveController}
          />
        ))}
      </div>
    );
  }
}

ConsortiumPipeline.propTypes = {
  connectDropTarget: PropTypes.func.isRequired,
  consortium: PropTypes.object.isRequired,
  owner: PropTypes.bool.isRequired,
};


export default compose(
  DragDropContext(HTML5Backend),
  DropTarget(ItemTypes.CONTROLLER, consortiumTarget, collect)
)(ConsortiumPipeline);
