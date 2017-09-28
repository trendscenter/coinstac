import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { DragDropContext, DropTarget } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import PropTypes from 'prop-types';
import shortid from 'shortid';
import { graphql } from 'react-apollo';
import {
  Button,
  Checkbox,
  ControlLabel,
  Form,
  FormControl,
  FormGroup,
} from 'react-bootstrap';
import ApolloClient from '../../state/apollo-client';
import Controller from './pipeline-controller';
import ItemTypes from './pipeline-item-types';
import { fetchAllConsortiaFunc, fetchComputationMetadata } from '../../state/graphql-queries';

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

class Pipeline extends Component {
  constructor(props) {
    super(props);

    let consortium = null;

    if (props.params.consortiumId) {
      const data = ApolloClient.readQuery({ query: fetchAllConsortiaFunc });
      consortium = data.fetchAllConsortia.find(cons => cons.id === props.params.consortiumId);
      delete consortium.__typename;
    }

    this.state = {
      consortium,
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

  addComputation(computation, controllerIndex) {
    const controllers = this.state.pipeline.controllers;
    controllers[controllerIndex].computations.push(computation);

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
      .find(c => c.idInPipeline === fromId);

    if (toId !== null) {
      index = this.state.pipeline.controllers[toController].computations
        .findIndex(c => c.idInPipeline === toId);
    } else {
      index = this.state.pipeline.controllers[fromController].computations
        .findIndex(c => c.idInPipeline === fromId);
    }

    controllers[fromController].computations = controllers[fromController].computations
      .filter(c => c.idInPipeline !== fromId);
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
    const { computations, connectDropTarget } = this.props;

    const title = 'New Pipeline';

    return connectDropTarget(
      <div>
        <div className="page-header clearfix">
          <h1 className="pull-left">{title}</h1>
        </div>
        <Form>
          <FormGroup controlId="name">
            <ControlLabel>Name</ControlLabel>
            <FormControl
              type="input"
              inputRef={(input) => { this.name = input; }}
            />
          </FormGroup>

          <FormGroup controlId="description">
            <ControlLabel>Description</ControlLabel>
            <FormControl
              type="input"
              inputRef={(input) => { this.description = input; }}
            />
          </FormGroup>

          <Checkbox inline>Share this pipeline with other consortia</Checkbox>

          <p style={{ padding: '30px 0 10px 0' }}>
            Build your pipelines by adding controllers in the space below.
            Controllers allow users to carry out actions on a computation or group of
            computations. Next, add computations to your controllers. Arrange
            controllers/computations vertically to determine their order from first
            (highest) to last (lowest):
          </p>

          <Button
            bsStyle="primary"
            type="button"
            onClick={this.addController}
            style={{ marginBottom: 10 }}
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
              allComputations={computations}
              addComputation={this.addComputation}
              moveComputation={this.moveComputation}
              moveController={this.moveController}
            />
          ))}
        </Form>
      </div>
    );
  }
}

Pipeline.propTypes = {
  auth: PropTypes.object.isRequired,
  computations: PropTypes.array.isRequired,
  connectDropTarget: PropTypes.func.isRequired,
  params: PropTypes.object.isRequired,
};

function mapStateToProps({ auth }) {
  return { auth };
}

const PipelineWithData = graphql(fetchComputationMetadata, {
  props: ({ data: { loading, fetchAllComputations } }) => ({
    loading,
    computations: fetchAllComputations,
  }),
})(Pipeline);

/*
const PipelineWithData = graphql(saveConsortiumFunc, {
  props: ({ mutate }) => ({
    saveConsortium: consortium => mutate({
      variables: { consortium },
      update: (store, { data: { saveConsortium } }) => {
        const data = store.readQuery({ query: fetchAllConsortiaFunc });
        const index = data.fetchAllConsortia.findIndex(cons => cons.id === saveConsortium.id);
        if (index > -1) {
          data.fetchAllConsortia[index] = { ...saveConsortium };
        } else {
          data.fetchAllConsortia.push(saveConsortium);
        }
        store.writeQuery({ query: fetchAllConsortiaFunc, data });
      },
    }),
  }),
})(Pipeline);
*/

export default compose(
  connect(mapStateToProps),
  DragDropContext(HTML5Backend),
  DropTarget(ItemTypes.CONTROLLER, consortiumTarget, collect)
)(PipelineWithData);
