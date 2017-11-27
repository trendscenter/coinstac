import React, { Component } from 'react';
import { connect } from 'react-redux';
import { graphql, compose } from 'react-apollo';
import { Alert, Button, Modal } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import PropTypes from 'prop-types';
import ListItem from '../common/list-item';
import ListDeleteModal from '../common/list-delete-modal';
import {
  DELETE_PIPELINE_MUTATION,
  FETCH_ALL_PIPELINES_QUERY,
  PIPELINE_CHANGED_SUBSCRIPTION,
} from '../../state/graphql/functions';
import {
  getAllAndSubProp,
  removeDocFromTableProp,
} from '../../state/graphql/props';

class PipelinesList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      pipelineToDelete: -1,
      showModal: false,
      unsubscribePipelines: null,
    };

    this.deletePipeline = this.deletePipeline.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.openModal = this.openModal.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    console.log(nextProps);
    if (nextProps.pipelines && !this.state.unsubscribePipelines) {
      this.setState({ unsubscribePipelines: this.props.subscribeToPipelines(null) });
    }
  }

  componentWillUnmount() {
    this.state.unsubscribePipelines();
  }

  closeModal() {
    this.setState({ showModal: false });
  }

  openModal(pipelineId) {
    return () => {
      this.setState({
        showModal: true,
        pipelineToDelete: pipelineId,
      });
    };
  }

  deletePipeline() {
    this.props.deletePipeline(this.state.pipelineToDelete);
    this.closeModal();
  }

  render() {
    const { auth: { user }, pipelines } = this.props;

    return (
      <div>
        <div className="page-header clearfix">
          <h1 className="pull-left">Pipelines</h1>
          <LinkContainer className="pull-right" to="/dashboard/pipelines/new">
            <Button bsStyle="primary" className="pull-right">
              <span aria-hidden="true" className="glphicon glyphicon-plus" />
              {' '}
              Create Pipeline
            </Button>
          </LinkContainer>
        </div>
        {pipelines && pipelines.map(pipeline => (
          <ListItem
            key={`${pipeline.name}-list-item`}
            itemObject={pipeline}
            deleteItem={this.openModal}
            owner={
              user.permissions.consortia[pipeline.owningConsortium] &&
              user.permissions.consortia[pipeline.owningConsortium].write
            }
            itemOptions={[]}
            itemRoute={'/dashboard/pipelines'}
          />
        ))}
        {(!pipelines || !pipelines.length) &&
          <Alert bsStyle="info">
            No pipelines found
          </Alert>
        }
        <ListDeleteModal
          close={this.closeModal}
          deleteItem={this.deletePipeline}
          itemName={'pipeline'}
          show={this.state.showModal}
        />
      </div>
    );
  }
}

PipelinesList.propTypes = {
  deletePipeline: PropTypes.func.isRequired,
  pipelines: PropTypes.array,
  subscribeToPipelines: PropTypes.func.isRequired,
};

PipelinesList.defaultProps = {
  pipelines: null,
};

const mapStateToProps = ({ auth }) => {
  return { auth };
};

const PipelinesListWithData = compose(
  graphql(DELETE_PIPELINE_MUTATION, removeDocFromTableProp(
    'pipelineId',
    'deletePipeline',
    FETCH_ALL_PIPELINES_QUERY,
    'fetchAllPipelines'
  )),
  graphql(FETCH_ALL_PIPELINES_QUERY, getAllAndSubProp(
    PIPELINE_CHANGED_SUBSCRIPTION,
    'pipelines',
    'fetchAllPipelines',
    'subscribeToPipelines',
    'pipelineChanged'
  ))
)(PipelinesList);

export default connect(mapStateToProps)(PipelinesListWithData);
