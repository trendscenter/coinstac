import React from 'react';
import { Typography } from '@material-ui/core';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { withStyles } from '@material-ui/core/styles';

const styles = () => ({
  fileIcon: {
    position: 'absolute',
    top: '0.9rem',
    left: '1rem',
    fontSize: '1rem',
  },
});

class MapsCsvFieldCsvHeader extends React.Component {
  componentDidMount() {
    const { registerDraggableContainer } = this.props;

    if (this.container) {
      registerDraggableContainer(this.container);
    }
  }

  render() {
    const { remainingHeader, classes } = this.props;

    return (
      <div>
        <Typography variant="h6">
          CSV Columns
        </Typography>
        <div className="card-deck" ref={(ref) => { this.container = ref; }}>
          {
            remainingHeader.map(columnName => (
              <div
                className={`card-draggable card-${columnName.toLowerCase()}`}
                data-string={columnName}
                key={columnName}
              >
                <FileCopyIcon className={classes.fileIcon} />
                { columnName }
              </div>
            ))
          }
        </div>
      </div>
    );
  }
}

export default withStyles(styles)(MapsCsvFieldCsvHeader);
