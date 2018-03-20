import React, { Component } from 'react';
import naturalSort from 'javascript-natural-sort';
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
import shortid from 'shortid';

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
    this.addFilesToGroup = this.addFilesToGroup.bind(this);
    this.removeFileGroup = this.removeFileGroup.bind(this);
    this.removeFileInGroup = this.removeFileInGroup.bind(this);
    this.updateNewFileOrg = this.updateNewFileOrg.bind(this);
  }

  addFileGroup() {
    ipcPromise.send('open-dialog', this.state.newFile.org)
    .then((obj) => {
      let newFiles;

      const fileGroupId = shortid.generate();

      if (obj.error) {
        this.setState({ filesError: obj.error });
      } else {
        const name = `Group ${Object.keys(this.props.collection.fileGroups).length + 1} (${obj.extension.toUpperCase()})`;
        if (this.state.newFile.org === 'metafile') {
          newFiles = {
            ...obj,
            name,
            id: fileGroupId,
            date: new Date().getTime(),
            firstRow: obj.metaFile[0].join(', '),
            org: this.state.newFile.org,
          };
        } else {
          newFiles = {
            name,
            id: fileGroupId,
            extension: obj.extension,
            files: [...obj.paths.sort(naturalSort)],
            date: new Date().getTime(),
            org: this.state.newFile.org,
          };

          this.setState({ showFiles: { [newFiles.date]: false } });
        }

        this.setState({ filesError: null });
        this.props.updateCollection(
          {
            param: 'fileGroups',
            value: {
              ...this.props.collection.fileGroups,
              [fileGroupId]: newFiles,
            },
          },
          this.props.saveCollection
        );
      }
    })
    .catch(console.log);
  }

  addFilesToGroup(groupId, extension) {
    return () => {
      ipcPromise.send('open-dialog', this.state.newFile.org)
      .then((obj) => {
        if (obj.error || (obj.extension && obj.extension !== extension)) {
          let filesError;
          if (obj.error) {
            filesError = obj.error;
          } else {
            filesError = `New files don't match group extension - ${extension} & ${obj.extension}.`;
          }
          this.setState({ filesError });
        } else {
          const groups = { ...this.props.collection.fileGroups };
          groups[groupId].files = groups[groupId].files.concat(obj.paths);
          groups[groupId].files.sort(naturalSort);

          this.props.updateCollection(
            {
              param: 'fileGroups',
              value: {
                ...groups,
              },
            },
            this.props.saveCollection
          );
        }
      })
      .catch(console.log);
    };
  }

  removeFileInGroup(groupId, fileIndex) {
    return () => {
      const groups = { ...this.props.collection.fileGroups };
      groups[groupId].files.splice(fileIndex, 1);

      this.props.updateCollection(
        {
          param: 'fileGroups',
          value: {
            ...groups,
          },
        },
        this.props.saveCollection
      );
    };
  }

  removeFileGroup(groupId) {
    return () => {
      const groups = { ...this.props.collection.fileGroups };
      delete groups[groupId];

      this.props.updateCollection(
        {
          param: 'fileGroups',
          value: {
            ...groups,
          },
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
            Add Group
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
                Manually Select Files
              </Radio>
            </FormGroup>

            <Button
              block
              bsStyle="primary"
              disabled={!this.state.newFile.org}
              onClick={this.addFileGroup}
            >
              Add Files Group
            </Button>
          </Panel>

          {this.state.filesError &&
            <Alert bsStyle="danger" style={{ ...styles.topMargin, textAlign: 'left', bottomMargin: 20 }}>
              <h4 style={{ fontStyle: 'normal' }}>File Error</h4>
              {this.state.filesError}
            </Alert>
          }

          {Object.values(collection.fileGroups).map(group => (
            <Panel key={`${group.date}-${group.extension}-${group.firstRow}`}>
              {group.org === 'metafile' &&
                <div>
                  <Button
                    bsStyle="danger"
                    className="pull-right"
                    onClick={this.removeFileGroup(group.id)}
                  >
                    <span aria-hidden="true" className="glyphicon glyphicon-trash" />
                    {' '}
                    Remove File Group
                  </Button>
                  <p style={styles.fileLabelRow}>
                    <span className="bold">Name:</span> {group.name}
                  </p>
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
                    onClick={this.removeFileGroup(group.id)}
                  >
                    <span aria-hidden="true" className="glyphicon glyphicon-trash" />
                    {' '}
                    Remove File Group
                  </Button>
                  <p style={styles.fileLabelRow}>
                    <span className="bold">Name:</span> {group.name}
                  </p>
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
                      <Button
                        bsStyle="success"
                        onClick={this.addFilesToGroup(group.id, group.extension)}
                        style={{ marginBottom: 10 }}
                      >
                        Add More Files to Group
                      </Button>
                      {group.files.map((file, fileIndex) =>
                        (<div key={file} style={{ marginBottom: 5 }}>
                          <button
                            aria-label="Delete"
                            style={{ border: 'none', background: 'none' }}
                            type="button"
                            onClick={this.removeFileInGroup(group.id, fileIndex)}
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

