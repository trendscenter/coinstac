import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import CancelIcon from '@material-ui/icons/Cancel';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';

const styles = theme => ({
  rootPaper: {
    marginTop: theme.spacing(1.5),
    minWidth: '250px',
    display: 'inline-flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nestedListItem: {
    paddingLeft: theme.spacing(3),
  },
  listDropzoneContainer: {
    flex: '1 0 auto',
    marginLeft: theme.spacing(0.5),
    maxWidth: '80px',
  },
  dropZone: {
    flex: '1 0 auto',
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

function MapsCsvFieldPipelineVariable({
  name, mappedColumn, unmapField, registerDraggableContainer, classes, dataType,
}) {
  const ref = useRef(null);

  useEffect(() => {
    registerDraggableContainer(ref);
  }, []);

  return (
    <div>
      <div className={classNames('drop-panel', classes.rootPaper)}>
        <Typography style={{ fontWeight: '500', fontSize: '1rem' }} className={classes.title}>
          {name}
        </Typography>
        <Typography style={{ fontWeight: '500', fontSize: '1rem', color: 'green' }} className={classes.title}>
          {`(${dataType})`}
        </Typography>
        <div className={classes.listDropzoneContainer}>
          <div className={classNames('drop-zone', classes.dropZone)}>
            <div
              className={`acceptor acceptor-${name}`}
              data-name={name}
              ref={ref => registerDraggableContainer(ref)}
              style={mappedColumn ? { display: 'none' } : {}}
            />
            {
              mappedColumn && (
                <div className="card-draggable">
                  <FileCopyIcon className={classes.fileIcon} />
                  {mappedColumn}
                  <IconButton
                    className={classes.closeButton}
                    onClick={() => unmapField(name, mappedColumn)}
                  >
                    <CancelIcon />
                  </IconButton>
                </div>
              )
            }
          </div>
        </div>
      </div>
    </div>
  );
}

MapsCsvFieldPipelineVariable.defaultProps = {
  mappedColumn: null,
};

MapsCsvFieldPipelineVariable.propTypes = {
  classes: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  dataType: PropTypes.string.isRequired,
  mappedColumn: PropTypes.any,
  unmapField: PropTypes.func.isRequired,
  registerDraggableContainer: PropTypes.func.isRequired,
};

export default withStyles(styles)(MapsCsvFieldPipelineVariable);
