import React, { Component } from 'react';
import { connect } from 'react-redux';
import { graphql } from 'react-apollo';
import { Link } from 'react-router';
import Button from '@material-ui/core/Button';
import Fab from '@material-ui/core/Fab';
import Typography from '@material-ui/core/Typography';
import AddIcon from '@material-ui/icons/Add';
import { withStyles } from '@material-ui/core/styles';
import { Alert } from 'react-bootstrap';
import PropTypes from 'prop-types';
import ListItem from '../common/list-item';
import ListDeleteModal from '../common/list-delete-modal';
import {
  DELETE_PIPELINE_MUTATION,
  FETCH_ALL_PIPELINES_QUERY,
} from '../../state/graphql/functions';
import {
  removeDocFromTableProp,
} from '../../state/graphql/props';

const MAX_LENGTH_PIPELINES = 5;

const styles = theme => ({
  button: {
    margin: theme.spacing.unit,
  },
});

class PipelinesList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      ownedPipelines: [],
      otherPipelines: [],
      pipelineToDelete: -1,
      showModal: false,
    };

    this.deletePipeline = this.deletePipeline.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.getListItem = this.getListItem.bind(this);
    this.openModal = this.openModal.bind(this);
  }

  static getDerivedStateFromProps(props) {
    const { pipelines, auth } = props;
    const ownedPipelines = [];
    const otherPipelines = [];
    if (pipelines && pipelines.length > MAX_LENGTH_PIPELINES) {
      const { user } = auth;
      pipelines.forEach((pipeline) => {
        if (user.permissions.consortia[pipeline.owningConsortium] &&
          user.permissions.consortia[pipeline.owningConsortium].includes('owner')) {
          ownedPipelines.push(pipeline);
        } else {
          otherPipelines.push(pipeline);
        }
      });
    }
    return { ownedPipelines, otherPipelines };
  }

  getListItem(pipeline) {
    const { user } = this.props.auth;
    return (
      <ListItem
        key={`${pipeline.name}-list-item`}
        itemObject={pipeline}
        deleteItem={this.openModal}
        owner={
          user.permissions.consortia[pipeline.owningConsortium]
          && user.permissions.consortia[pipeline.owningConsortium].includes('owner')
        }
        itemOptions={{ actions: [], text: [] }}
        itemRoute="/dashboard/pipelines"
      />
    );
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
    const { pipelines, classes } = this.props;
    const { ownedPipelines, otherPipelines } = this.state;

    return (
      <div>
        <div className="page-header">
          <Typography variant="h4">
            Pipelines
          </Typography>
          <Fab
            color="primary"
            component={Link}
            to="/dashboard/pipelines/new"
            className={classes.button}
            name="create-pipeline-button"
          >
            <AddIcon />
          </Fab>
        </div>
        {
          pipelines && pipelines.length && pipelines.length <= MAX_LENGTH_PIPELINES
          && pipelines.map(pipeline => this.getListItem(pipeline))
        }
        {ownedPipelines.length > 0 && <Typography variant="h6">Owned Pipelines</Typography>}
        {ownedPipelines.length > 0 && ownedPipelines.map(pipeline => this.getListItem(pipeline))}
        {otherPipelines.length > 0 && <Typography variant="h6">Other Pipelines</Typography>}
        {otherPipelines.length > 0 && otherPipelines.map(pipeline => this.getListItem(pipeline))}

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
  auth: PropTypes.object.isRequired,
  deletePipeline: PropTypes.func.isRequired,
  pipelines: PropTypes.array,
};

PipelinesList.defaultProps = {
  pipelines: null,
};

const mapStateToProps = ({ auth }) => {
  return { auth };
};

const PipelinesListWithData = graphql(DELETE_PIPELINE_MUTATION,
  removeDocFromTableProp(
    'pipelineId',
    'deletePipeline',
    FETCH_ALL_PIPELINES_QUERY,
    'fetchAllPipelines'
  )
)(PipelinesList);

const connectedComponent = connect(mapStateToProps)(PipelinesListWithData);

export default withStyles(styles)(connectedComponent);
