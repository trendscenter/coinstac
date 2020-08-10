/* eslint-disable react/no-find-dom-node */
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import Icon from '@material-ui/core/Icon';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import { withStyles } from '@material-ui/core/styles';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import classNames from 'classnames';
import path from 'path';

const styles = theme => ({
  rootPaper: {
    ...theme.mixins.gutters(),
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
    marginTop: theme.spacing(2),
    height: '100%',
  },
  title: {
    marginBottom: theme.spacing(1),
    fontWeight: '500',
    fontSize: '1rem',
  },
  nestedListItem: {
    paddingLeft: theme.spacing(2),
    paddingTop: 0,
    paddingBottom: 0,
  },
  listDropzoneContainer: {
    display: 'flex',
  },
  interestList: {
    width: '50%',
    flex: '0 0 auto',
    marginRight: theme.spacing(1),
    paddingLeft: 0,
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
});

class MapsStepFieldData extends Component {
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

  strMasseuse = (filepath) => {
    let filename = path.basename(filepath, path.extname(filepath));
    if (filename.length > 12) {
      filename = `...${filename.slice(filename.length - 12)}`;
    }
    return filename;
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

    const name = step.type;

    const isMapped = !!column;

    return (
      <Paper
        className={classNames('drop-panel', classes.rootPaper)}
        elevation={1}
      >
        <Typography className={classes.title}>
          {step.type}
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
                    <FileCopyIcon />
                    { this.strMasseuse(column) }
                    <Icon
                      className={classNames('fa fa-times-circle', classes.timesIcon)}
                      onClick={() => unmapField(type, column)}
                    />
                  </div>
                ) : (
                  <div
                    className="acceptor acceptor-data"
                    data-type={type}
                    data-name={name}
                    ref={(ref) => { this.container = ref; }}
                  />
                )
            }
          </div>
        </div>
        {
          step.value && (
            <div className={classes.listDropzoneContainer}>
              <List className={classes.interestList}>
                <ListItem style={{ paddingLeft: 0 }}>
                  <ListItemText primary="Interest(s):" />
                </ListItem>
                {
                  step.value
                  && step.value.map((key, i) => (
                    <ListItem key={key} className={classes.nestedListItem}>
                      <ListItemText
                        style={{ whiteSpace: 'nowrap' }}
                        secondary={step.value[i]}
                      />
                    </ListItem>
                  ))
                }
              </List>
            </div>
          )
        }
      </Paper>
    );
  }
}

MapsStepFieldData.defaultProps = {
  column: null,
};

MapsStepFieldData.propTypes = {
  classes: PropTypes.object.isRequired,
  column: PropTypes.string,
  step: PropTypes.object.isRequired,
  type: PropTypes.string.isRequired,
  registerDraggableContainer: PropTypes.func.isRequired,
  unmapField: PropTypes.func.isRequired,
};

export default withStyles(styles)(MapsStepFieldData);
