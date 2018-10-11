import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import { LinkContainer } from 'react-router-bootstrap';
import {
  Alert,
  Button,
  Col,
  Grid,
  Panel,
  Row,
} from 'react-bootstrap';
import ListDeleteModal from '../common/list-delete-modal';
import {
  FETCH_ALL_COMPUTATIONS_QUERY,
  REMOVE_COMPUTATION_MUTATION,
} from '../../state/graphql/functions';
import {
  getDockerImages,
  pullComputations,
  removeImage,
} from '../../state/ducks/docker';
import { removeDocFromTableProp } from '../../state/graphql/props';
import ComputationIO from './computation-io';

const MAX_LENGTH_COMPUTATIONS = 5;

const styles = {
  outputBox: { marginTop: 10, height: 400, overflowY: 'scroll' },
  topMargin: { marginTop: 10 },
};

class ComputationsList extends Component { // eslint-disable-line
  constructor(props) {
    super(props);

    this.state = {
      activeComp: null,
      computationToDelete: -1,
      ownedComputations: [],
      otherComputations: [],
      showModal: false,
    };

    this.getTable = this.getTable.bind(this);
    this.pullComputations = this.pullComputations.bind(this);
    this.removeComputation = this.removeComputation.bind(this);
    this.removeImage = this.removeImage.bind(this);
    this.setActiveComp = this.setActiveComp.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.openModal = this.openModal.bind(this);
  }

  componentDidMount() {
    this.props.getDockerImages();
  }

  static getDerivedStateFromProps(props) {
    const { computations, user } = props;
    const ownedComputations = [];
    const otherComputations = [];
    if (computations && computations.length > MAX_LENGTH_COMPUTATIONS) {
      computations.forEach((comp) => {
        if (user.id === comp.submittedBy) {
          ownedComputations.push(comp);
        } else {
          otherComputations.push(comp);
        }
      });
    }
    return { ownedComputations, otherComputations };
  }

  getTable(computations) {
    const { auth: { user }, docker } = this.props;
    return (
      <div style={styles.topMargin}>
        {computations.map((comp) => {
          const title = (<h1>{comp.meta.name}</h1>);

          return (
            <Panel header={title} key={`${comp.id}-panel`}>
              <p>{comp.meta.description}</p>
              <Grid>
                <Row>
                  <Col xs={4}>
                    <Button bsStyle="primary" onClick={this.setActiveComp(comp)}>
                      {this.state.activeComp &&
                        this.state.activeComp.meta.name === comp.meta.name &&
                        'Hide IO'
                      }
                      {(!this.state.activeComp ||
                        (this.state.activeComp &&
                          this.state.activeComp.meta.name !== comp.meta.name)
                        ) &&
                        'Get IO'
                      }
                    </Button>
                  </Col>
                  <Col xs={4}>
                    {!docker.localImages[comp.computation.dockerImage] &&
                      <Button
                        bsStyle="success"
                        onClick={
                          this.pullComputations([{
                            img: comp.computation.dockerImage,
                            compId: comp.id,
                            compName: comp.meta.name,
                          }])
                        }
                      >
                        Download Image
                      </Button>
                    }
                    {docker.localImages[comp.computation.dockerImage] &&
                      <Button
                        bsStyle="warning"
                        onClick={
                          this.removeImage(
                            comp.id,
                            comp.computation.dockerImage,
                            docker.localImages[comp.computation.dockerImage].id
                          )
                        }
                      >
                        Remove Image (
                        <em>{docker.localImages[comp.computation.dockerImage].size.toString().slice(0, -6)} MB</em>)
                      </Button>
                    }
                  </Col>
                  {user.id === comp.submittedBy &&
                    <Col xs={4}>
                      <Button bsStyle="danger" onClick={this.openModal(comp.id)}>
                        Delete
                      </Button>
                    </Col>
                  }
                </Row>
              </Grid>
              {docker.dockerOut[comp.id] &&
                <pre style={{ marginTop: 15 }}>
                  {docker.dockerOut[comp.id].map(elem => (
                    <div
                      key={elem.id && elem.id !== 'latest' ? elem.id : elem.status}
                      style={elem.isErr ? { color: 'red' } : {}}
                    >
                      {elem.id ? `${elem.id}: ` : ''}{elem.status} {elem.message} {elem.progress}
                    </div>
                  ))}
                </pre>
              }
              {this.state.activeComp && this.state.activeComp.meta.name === comp.meta.name &&
                <ComputationIO computationId={this.state.activeComp.id} />
              }
            </Panel>
          );
        })}
      </div>
    );
  }

  setActiveComp(comp) {
    return () => {
      if (!this.state.activeComp || this.state.activeComp.meta.name !== comp.meta.name) {
        this.setState({ activeComp: comp });
      } else {
        this.setState({ activeComp: null });
      }
    };
  }

  closeModal() {
    this.setState({ showModal: false });
  }

  openModal(computationId) {
    return () => {
      this.setState({
        showModal: true,
        computationToDelete: computationId,
      });
    };
  }

  pullComputations(comps) {
    return () => {
      this.props.pullComputations({ computations: comps });
    };
  }

  removeComputation() {
    this.props.removeComputation(this.state.computationToDelete);
    this.closeModal();
  }

  removeImage(compId, imgId, imgName) {
    return () => {
      this.props.removeImage(compId, imgId, imgName)
        .then(() => {
          this.props.getDockerImages();
        });
    };
  }

  render() {
    const { computations } = this.props;
    const { ownedComputations, otherComputations } = this.state;

    return (
      <div>
        <div className="page-header clearfix">
          <h1 className="nav-item-page-title">Computations</h1>
          <LinkContainer className="pull-right" to="/dashboard/computations/new">
            <Button bsStyle="primary" className="pull-right">
              <span aria-hidden="true" className="glphicon glyphicon-plus" />
              {' '}
              Create Computation
            </Button>
          </LinkContainer>
        </div>

        {computations && computations.length > 0 &&
          <Button
            bsStyle="primary"
            onClick={this.pullComputations(
              computations.map(comp => ({
                img: comp.computation.dockerImage,
                compId: comp.id,
                compName: comp.meta.name,
              }))
            )}
          >
            Download All
          </Button>
        }

        {computations && computations.length > 0 &&
          computations.length <= MAX_LENGTH_COMPUTATIONS && this.getTable(computations)
        }
        {ownedComputations.length > 0 && <h4>Owned Computations</h4>}
        {ownedComputations.length > 0 && this.getTable(ownedComputations)}
        {otherComputations.length > 0 && <h4>Other Computations</h4>}
        {otherComputations.length > 0 && this.getTable(otherComputations)}

        {(!computations || !computations.length) &&
          <Alert bsStyle="info">
            No computations found
          </Alert>
        }

        <ListDeleteModal
          close={this.closeModal}
          deleteItem={this.removeComputation}
          itemName={'computation'}
          show={this.state.showModal}
        />
      </div>
    );
  }
}

ComputationsList.defaultProps = {
  removeComputation: null,
};

ComputationsList.propTypes = {
  auth: PropTypes.object.isRequired,
  computations: PropTypes.array.isRequired,
  docker: PropTypes.object.isRequired,
  getDockerImages: PropTypes.func.isRequired,
  pullComputations: PropTypes.func.isRequired,
  removeComputation: PropTypes.func,
  removeImage: PropTypes.func.isRequired,
};

function mapStateToProps({ auth, docker }) {
  return { auth, docker };
}

const ComputationsListWithData = graphql(REMOVE_COMPUTATION_MUTATION,
  removeDocFromTableProp(
    'computationId',
    'removeComputation',
    FETCH_ALL_COMPUTATIONS_QUERY,
    'fetchAllComputations'
  )
)(ComputationsList);


export default connect(mapStateToProps,
  { getDockerImages, pullComputations, removeImage }
)(ComputationsListWithData);
