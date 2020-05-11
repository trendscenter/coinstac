import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import { Link } from 'react-router';
import Button from '@material-ui/core/Button';
import Fab from '@material-ui/core/Fab';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import AddIcon from '@material-ui/icons/Add';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
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

const styles = theme => ({
  titleContainer: {
    marginBottom: theme.spacing.unit * 2,
  },
  downloadAllButton: {
    marginBottom: theme.spacing.unit * 4,
  },
  computationsContainer: {
    marginBottom: theme.spacing.unit * 4,
  },
  rootPaper: {
    ...theme.mixins.gutters(),
    paddingTop: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 2,
    marginTop: theme.spacing.unit * 2,
  },
  computationName: {
    marginBottom: theme.spacing.unit,
  },
  computationDescription: {
    marginBottom: theme.spacing.unit * 2,
  },
  computationActions: {
    display: 'flex',
    justifyContent: 'space-around',
  },
});

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
    const { getDockerImages } = this.props;
    getDockerImages();
  }

  static getDerivedStateFromProps(props) {
    const { computations, auth } = props;
    const ownedComputations = [];
    const otherComputations = [];
    if (computations && computations.length > MAX_LENGTH_COMPUTATIONS) {
      computations.forEach((comp) => {
        if (auth.user.id === comp.submittedBy) {
          ownedComputations.push(comp);
        } else {
          otherComputations.push(comp);
        }
      });
    }
    return { ownedComputations, otherComputations };
  }

  getTable(computations) {
    const { auth: { user }, docker, classes } = this.props;
    const { activeComp } = this.state;

    const sortedComputations = computations.sort((a, b) => {
      const nameA = a.meta.name.toLowerCase();
      const nameB = b.meta.name.toLowerCase();

      if (nameA < nameB) {
        return -1;
      }

      return (nameA > nameB) ? 1 : 0;
    });

    return (
      <div className={classes.computationsContainer}>
        {
          sortedComputations.map((comp) => {
            const compLocalImage = docker.localImages[comp.computation.dockerImage];

            return (
              <Paper
                className={classes.rootPaper}
                elevation={1}
                key={comp.id}
              >
                <Typography variant="headline" className={classes.computationName}>
                  { comp.meta.name }
                </Typography>
                <Typography variant="body1" className={classes.computationDescription}>
                  { comp.meta.description }
                </Typography>
                <div className={classes.computationActions}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={this.setActiveComp(comp)}
                  >
                    {
                      activeComp && activeComp.meta.name === comp.meta.name ? 'Hide IO' : 'Get IO'
                    }
                  </Button>
                  {
                    !compLocalImage
                    && (
                      <Button
                        variant="contained"
                        color="secondary"
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
                    )
                  }
                  {
                    compLocalImage
                    && (
                      <Button
                        variant="contained"
                        color="secondary"
                        onClick={
                          this.removeImage(
                            comp.id,
                            comp.computation.dockerImage,
                            compLocalImage.id
                          )
                        }
                      >
                        Remove Image (
                        <em>
                          { compLocalImage.size.toString().slice(0, -6) }
                          {' '}
MB
                        </em>
)
                      </Button>
                    )
                  }
                  {
                    user.id === comp.submittedBy
                    && (
                      <Button
                        variant="contained"
                        onClick={this.openModal(comp.id)}
                      >
                        Delete
                      </Button>
                    )
                  }
                </div>
                {
                  docker.dockerOut[comp.id]
                  && (
                    <pre style={{ marginTop: 15 }}>
                      {docker.dockerOut[comp.id].map(elem => (
                        <div
                          key={elem.id && elem.id !== 'latest' ? elem.id : elem.status}
                          style={elem.isErr ? { color: 'red' } : {}}
                        >
                          {elem.id ? `${elem.id}: ` : ''}
                          {elem.status}
                          {' '}
                          {elem.message}
                          {' '}
                          {elem.progress}
                        </div>
                      ))}
                    </pre>
                  )
                }
                {
                  activeComp && activeComp.meta.name === comp.meta.name
                  && <ComputationIO computationId={activeComp.id} />
                }
              </Paper>
            );
          })
        }
      </div>
    );
  }

  setActiveComp(comp) {
    const { activeComp } = this.state;
    return () => {
      if (!activeComp || activeComp.meta.name !== comp.meta.name) {
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
    const { pullComputations } = this.props;
    return () => {
      pullComputations({ computations: comps });
    };
  }

  removeComputation() {
    const { removeComputation } = this.props;
    const { computationToDelete } = this.state;
    removeComputation(computationToDelete);
    this.closeModal();
  }

  removeImage(compId, imgId, imgName) {
    const { getDockerImages, removeImage } = this.props;

    return () => {
      removeImage(compId, imgId, imgName)
        .then(() => {
          getDockerImages();
        });
    };
  }

  render() {
    const { computations, classes } = this.props;
    const { ownedComputations, otherComputations, showModal } = this.state;

    return (
      <div>
        <div className={classNames('page-header', classes.titleContainer)}>
          <Typography variant="h4">
            Computations
          </Typography>
          <Fab
            color="primary"
            component={Link}
            to="/dashboard/computations/new"
            className={classes.button}
          >
            <AddIcon />
          </Fab>
        </div>
        {
          computations && computations.length > 0
          && (
            <Button
              variant="contained"
              color="primary"
              className={classes.downloadAllButton}
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
          )
        }

        {
          computations && computations.length > 0
          && computations.length <= MAX_LENGTH_COMPUTATIONS && this.getTable(computations)
        }
        {ownedComputations.length > 0 && <Typography variant="h6">Owned Computations</Typography>}
        {ownedComputations.length > 0 && this.getTable(ownedComputations)}
        {otherComputations.length > 0 && <Typography variant="h6">Other Computations</Typography>}
        {otherComputations.length > 0 && this.getTable(otherComputations)}

        {
          (!computations || !computations.length)
          && (
            <Typography variant="body1">
              No computations found
            </Typography>
          )
        }

        <ListDeleteModal
          close={this.closeModal}
          deleteItem={this.removeComputation}
          itemName="computation"
          show={showModal}
          warningMessage="This action will delete the computation, invalidating all pipelines that are currently using it."
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
  classes: PropTypes.object.isRequired,
  computations: PropTypes.array.isRequired,
  docker: PropTypes.object.isRequired,
  getDockerImages: PropTypes.func.isRequired,
  pullComputations: PropTypes.func.isRequired,
  removeComputation: PropTypes.func,
  removeImage: PropTypes.func.isRequired,
};

const mapStateToProps = ({ auth, docker }) => ({
  auth, docker,
});

const ComputationsListWithData = graphql(REMOVE_COMPUTATION_MUTATION,
  removeDocFromTableProp(
    'computationId',
    'removeComputation',
    FETCH_ALL_COMPUTATIONS_QUERY,
    'fetchAllComputations'
  ))(ComputationsList);

const connectedComponent = connect(mapStateToProps,
  { getDockerImages, pullComputations, removeImage })(ComputationsListWithData);

export default withStyles(styles)(connectedComponent);
