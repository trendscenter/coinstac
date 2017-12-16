import React, { Component } from 'react';
import {
  Accordion,
  Alert,
  Button,
  Form,
  FormGroup,
  Panel,
  Radio,
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
      filesError: null,
      newFile: {
        open: false,
        org: '',
      },
      showFiles: {},
    };

    this.addFileGroup = this.addFileGroup.bind(this);
    this.removeFileGroup = this.removeFileGroup.bind(this);
    this.removeFileInGroup = this.removeFileInGroup.bind(this);
    this.updateNewFileOrg = this.updateNewFileOrg.bind(this);
  }

  addFileGroup() {
    ipcPromise.send('open-dialog', this.state.newFile.org)
    .then((obj) => {
      console.log(obj);
      let newFiles;

      if (obj.error) {
        this.setState({ filesError: obj.error });
      } else {
        if (this.state.newFile.org === 'metafile') {
          newFiles = {
            ...obj,
            extension: 'csv',
            date: new Date().getTime(),
            firstRow: obj.metaFile[0].join(', '),
            org: this.state.newFile.org,
          };
        } else {
          newFiles = {
            extension: obj.extension,
            files: [...obj.paths.sort()],
            date: new Date().getTime(),
            org: this.state.newFile.org,
          };

          this.setState({ showFiles: { [newFiles.date]: false } });
        }

        this.setState({ filesError: null });
        this.props.updateCollection(
          {
            param: 'fileGroups',
            value: [
              ...this.props.collection.fileGroups,
              newFiles,
            ],
          },
          this.props.saveCollection
        );
      }
    })
    .catch(console.log);
  }

  removeFileInGroup(groupIndex, fileIndex) {
    return () => {
      const groups = [...this.props.collection.fileGroups];
      groups[groupIndex].files.splice(fileIndex, 1);

      this.props.updateCollection(
        {
          param: 'fileGroups',
          value: [
            ...groups,
          ],
        },
        this.props.saveCollection
      );
    };
  }

  removeFileGroup(groupIndex) {
    return () => {
      const groups = [...this.props.collection.fileGroups];
      groups.splice(groupIndex);

      this.props.updateCollection(
        {
          param: 'fileGroups',
          value: [
            ...groups,
          ],
        },
        this.props.saveCollection
      );
    };
  }

  updateNewFileOrg(ev) {
    this.setState({ newFile: { ...this.state.newFile, org: ev.target.value } });
  }

  render() {
    const {
      collection,
      saveCollection,
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
                checked={this.state.newFile.org === 'manual'}
                onChange={this.updateNewFileOrg}
                value="manual"
              >
                Maually Select Files
              </Radio>
            </FormGroup>

            <Button
              block
              bsStyle="primary"
              disabled={!this.state.newFile.org}
              onClick={this.addFileGroup}
            >
              Add Files to Collection
            </Button>
          </Panel>

          {this.state.filesError &&
            <Alert bsStyle="danger" style={{ ...styles.topMargin, textAlign: 'left' }}>
              <h4 style={{ fontStyle: 'normal' }}>File Error</h4>
              {this.state.filesError}
            </Alert>
          }

          {collection.fileGroups.map((group, groupIndex) => (
            <Panel key={`${group.date}-${group.extension}-${group.firstRow}`}>
              {group.org === 'metafile' &&
                <div>
                  <Button
                    bsStyle="danger"
                    className="pull-right"
                    onClick={this.removeFileGroup(groupIndex)}
                  >
                    <span aria-hidden="true" className="glyphicon glyphicon-trash" />
                    {' '}
                    Remove File Group
                  </Button>
                  <p style={styles.fileLabelRow}>
                    <span className="bold">Date:</span> {new Date(group.date).toUTCString()}
                  </p>
                  <p style={styles.fileLabelRow}>
                    <span className="bold">Extension:</span> {group.extension}
                  </p>
                  <p style={styles.fileLabelRow}>
                    <span className="bold">Meta File Path:</span> {group.metaFilePath}
                  </p>
                  <p style={styles.fileLabelRow}>
                    <span className="bold">First Row:</span> {group.firstRow}
                  </p>
                </div>
              }
              {group.org === 'manual' &&
                <div>
                  <Button
                    bsStyle="danger"
                    className="pull-right"
                    onClick={this.removeFileGroup(groupIndex)}
                  >
                    <span aria-hidden="true" className="glyphicon glyphicon-trash" />
                    {' '}
                    Remove File Group
                  </Button>
                  <p style={styles.fileLabelRow}>
                    <span className="bold">Date:</span> {new Date(group.date).toUTCString()}
                  </p>
                  <p style={styles.fileLabelRow}>
                    <span className="bold">Extension:</span> {group.extension}
                  </p>
                  <Accordion>
                    <Panel
                      header={`Files (${group.files.length}):`}
                      style={{ marginTop: 10 }}
                    >
                      {group.files.map((file, fileIndex) =>
                        (<div key={file} style={{ marginBottom: 5 }}>
                          <button
                            aria-label="Delete"
                            style={{ border: 'none', background: 'none' }}
                            type="button"
                            onClick={this.removeFileInGroup(groupIndex, fileIndex)}
                          >
                            <span aria-hidden="true" className="glyphicon glyphicon-remove" style={{ color: 'red' }} />
                          </button>
                          {file}
                        </div>)
                      )}
                    </Panel>
                  </Accordion>
                </div>
              }
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

