import React, { Component } from 'react';
import {
  Button,
  Col,
  ControlLabel,
  Form,
  FormGroup,
  FormControl,
  Panel,
  Radio,
  Row,
} from 'react-bootstrap';
import PropTypes from 'prop-types';
import ipcPromise from 'ipc-promise';

const styles = {
  fileLabelRow: { margin: 0 },
};

export default class CollectionFiles extends Component {
  constructor(props) {
    super(props);

    this.state = {
      newFile: {
        open: false,
        org: '',
      },
    };

    this.addFiles = this.addFiles.bind(this);
    this.updateNewFileOrg = this.updateNewFileOrg.bind(this);
  }

  addFiles() {
    ipcPromise.send('add-files', this.state.org)
    .then((obj) => {
      this.props.updateCollection(
        {
          param: 'files',
          value: [
            ...this.props.collection.files,
            { ...obj, extension: 'csv', date: new Date().getTime(), firstRow: obj.metaFile[0].join(', ') },
          ],
        },
        this.props.saveCollection
      );
    })
    .catch(console.log);
  }

  updateNewFileOrg(ev) {
    this.setState({ newFile: { ...this.state.newFile, org: ev.target.value } });
  }

  render() {
    const {
      collection,
      saveCollection,
      updateCollection,
    } = this.props;

    return (
      <div>
        <Form onSubmit={saveCollection}>
          <h3>Collection Files</h3>
          <Button
            bsStyle="primary"
            style={{ marginBottom: 10 }}
            onClick={() => this.setState({ newFile: { open: !this.state.newFile.open } })}
          >
            Add Files
          </Button>

          <Panel
            collapsible
            expanded={this.state.newFile.open}
          >
            <p className="bold">The organization of my files is best derived via:</p>
            <FormGroup>
              <Radio
                name="radioGroup"
                checked={this.state.newFile.org === 'metafile'}
                onChange={this.updateNewFileOrg}
                value="metafile"
              >
                A metadata file containing file paths and covariates.
              </Radio>
              <Radio
                name="radioGroup"
                checked={this.state.newFile.org === 'directory'}
                onChange={this.updateNewFileOrg}
                value="directory"
              >
                Directory structure
              </Radio>
            </FormGroup>

            <Button
              block
              bsStyle="primary"
              disabled={!this.state.newFile.org}
              onClick={this.addFiles}
            >
              Add Files to Collection
            </Button>
          </Panel>

          {collection.files.map(file => (
            <Panel key={`${file.date}-${file.extension}-${file.firstRow}`}>
              {file.metaFilePath &&
                <p style={styles.fileLabelRow}>
                  <span className="bold">Meta File Path:</span> {file.metaFilePath}
                </p>
              }
              <p style={styles.fileLabelRow}>
                <span className="bold">Extension:</span> {file.extension}
              </p>
              <p style={styles.fileLabelRow}>
                <span className="bold">Date:</span> {file.date}
              </p>
              <p style={styles.fileLabelRow}>
                <span className="bold">First Row:</span> {file.firstRow}
              </p>
            </Panel>
          ))}
        </Form>
      </div>
    );
  }
}

CollectionFiles.propTypes = {
  collection: PropTypes.object,
  saveCollection: PropTypes.func.isRequired,
  updateCollection: PropTypes.func.isRequired,
};

CollectionFiles.defaultProps = {
  collection: null,
};

