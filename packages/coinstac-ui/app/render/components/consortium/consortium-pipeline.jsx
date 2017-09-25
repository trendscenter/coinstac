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
    this.addController = this.addController.bind(this);
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

  moveController(id, swapId) {
    let index = 0;
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
            key={controller.id}
            id={controller.id}
            originalIndex={index}
            controller={controller}
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
