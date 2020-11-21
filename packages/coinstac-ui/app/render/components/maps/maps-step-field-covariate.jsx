/* eslint-disable react/no-find-dom-node */
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import IconButton from '@material-ui/core/IconButton';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import CancelIcon from '@material-ui/icons/Cancel';
import classNames from 'classnames';

const styles = theme => ({
  rootPaper: {
    ...theme.mixins.gutters(),
    paddingTop: theme.spacing(1.5),
    paddingBottom: theme.spacing(1.5),
    marginTop: theme.spacing(1.5),
    height: '100%',
  },
  title: {
    marginBottom: theme.spacing(1.5),
  },
  nestedListItem: {
    paddingLeft: theme.spacing(3),
  },
  listDropzoneContainer: {
    display: 'flex',
  },
  interestList: {
    width: '50%',
    flex: '0 0 auto',
    marginRight: theme.spacing(1),
  },
  dropZone: {
    flex: '1 0 auto',
  },
  timesIcon: {
    color: '#f05a29 !important',
    fontSize: '1.25rem',
    position: 'absolute',
    top: '-0.75rem',
    right: '-0.75rem',
    background: 'white',
    borderRadius: '50%',
    border: '2px solid white',
    width: '1.5rem',
    height: '1.5rem',
  },
  fileIcon: {
    position: 'absolute',
    top: '0.9rem',
    left: '1rem',
    fontSize: '1rem',
  },
  closeButton: {
    background: 'white',
    color: '#f05a29 !important',
    padding: 0,
    position: 'absolute',
    top: '-0.75rem',
    right: '-0.75rem',
    width: '1.5rem',
    height: '1.5rem',
  },
});

class MapsStepFieldCovariate extends Component {
  componentDidMount() {
    const { registerDraggableContainer } = this.props;

    if (this.container) {
      const Container = ReactDOM.findDOMNode(this.container);
      registerDraggableContainer(Container);
    }
  }

  componentDidUpdate(prevProps) {
    const { registerDraggableContainer, column } = this.props;

    if (prevProps.column !== column && this.container) {
      const Container = ReactDOM.findDOMNode(this.container);
      registerDraggableContainer(Container);
    }
  }

  render() {
    const {
      step,
      label,
      type,
      classes,
      column,
      unmapField,
    } = this.props;


    const { name } = step;

    const isMapped = !!column;

    return (
      <Paper
        className={classNames('drop-panel', classes.rootPaper)}
        elevation={1}
      >
        <Typography style={{ fontWeight: '500', fontSize: '1rem' }} className={classes.title}>
          { name }
        </Typography>
        <div className={classes.listDropzoneContainer}>
          <div className={classNames('drop-zone', classes.dropZone)}>
            {
              isMapped
                ? (
                  <div
                    className="card-draggable"
                    ref={(ref) => { this.container = ref; }}
                  >
                    <FileCopyIcon className={classes.fileIcon} />
                    { column }
                    <IconButton
                      className={classes.closeButton}
                      onClick={() => unmapField(type, column)}
                    >
                      <CancelIcon />
                    </IconButton>
                  </div>
                ) : (
                  <div
                    className={`acceptor acceptor-${name}`}
                    data-type={type}
                    data-name={name}
                    ref={(ref) => { this.container = ref; }}
                  />
                )
            }
          </div>
        </div>
      </Paper>
    );
  }
}

MapsStepFieldCovariate.defaultProps = {
  column: null,
};

MapsStepFieldCovariate.propTypes = {
  classes: PropTypes.object.isRequired,
  column: PropTypes.string,
  step: PropTypes.object.isRequired,
  type: PropTypes.string.isRequired,
  registerDraggableContainer: PropTypes.func.isRequired,
  unmapField: PropTypes.func.isRequired,
};

export default withStyles(styles)(MapsStepFieldCovariate);
