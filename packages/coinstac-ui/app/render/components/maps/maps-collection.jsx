import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { compose, graphql, withApollo } from 'react-apollo';
import { LinkContainer } from 'react-router-bootstrap';
import {
  Accordion,
  Alert,
  Button,
  Card,
  Form,
  FormGroup,
  Panel,
  Radio,
} from 'react-bootstrap';
import ipcPromise from 'ipc-promise';
import PropTypes from 'prop-types';
import shortid from 'shortid';
import dragula from 'react-dragula';
import { unmapAssociatedConsortia } from '../../state/ducks/collections';
import bitap from 'bitap';

const styles = {
  fileLabelRow: {
    margin: 0
  },
};

class MapsCollection extends Component {

  constructor(props) {
    super(props);

    this.state = {
      autoMap: false,
      contChildren: -1,
      filesError: null,
      newFile: {
        open: false,
        org: 'metafile',
      },
      showFiles: {},
      source: {},
    };

    this.addFileGroup = this.addFileGroup.bind(this);
    this.removeFileGroup = this.removeFileGroup.bind(this);
    this.updateNewFileOrg = this.updateNewFileOrg.bind(this);
    this.updateMapsStep = this.updateMapsStep.bind(this);
    this.setStepIO = this.setStepIO.bind(this);
  }

  componentDidUpdate(prevProps,prevState) {
    if(this.refs.Container){
      let children = 0;
      let Container = ReactDOM.findDOMNode(this.refs.Container);
      if(this.state.autoMap){ //this is a hacky hack to get button change to work on drag and drop mapping :(
        children = Container.children.length - 1;
      }else{
        children = Container.children.length;
      }
      if(prevState.contChildren !== children){
        this.setState(prevState => ({
          contChildren: children
        }));
      }
      this.props.getContainers(Container);
    }
  }

  addFileGroup() {
    ipcPromise.send('open-dialog', 'metafile')
    .then((obj) => {
      let newFiles;

      const fileGroupId = shortid.generate();

      if (obj.error) {
        this.setState({ filesError: obj.error });
      } else {
        const name = `Group ${Object.keys(this.props.collection.fileGroups).length + 1} (${obj.extension.toUpperCase()})`;
        if (this.state.newFile.org === 'metafile') {
          this.props.setRowArray(obj.metaFile[0]);
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
            fileGroups: {
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

 filterGetObj(arr, searchKey) {
    let searchkey = searchKey.replace('file', ''); //other object values contain the string 'file', let's remove.
    return arr.filter(function(obj) {
      return Object.keys(obj).some(function(key) {
        let objkey = obj[key];
        if(typeof objkey === 'string'){
          let fuzzy = bitap(objkey, searchkey, 1);
          if(fuzzy.length){
            return obj[key];
          }
        }
      })
    });
  }

  filterGetIndex(arr, searchKey) {
     let searchkey = searchKey.replace('file', ''); //other object values contain the string 'file', let's remove.
     return arr.findIndex(function(obj) {
       return Object.keys(obj).some(function(key) {
         let objkey = obj[key];
         if(typeof objkey === 'string'){
           let fuzzy = bitap(objkey, searchkey, 1);
           if(fuzzy.length){
             return obj[key];
           }
         }
       })
     });
   }

  autoMap(group) {
    this.setState({ autoMap: true });
    let covariates = this.props.collection.associatedConsortia.pipelineSteps[0].inputMap.covariates.ownerMappings;
    let data = this.props.collection.associatedConsortia.pipelineSteps[0].inputMap.data.ownerMappings;
    this.makePoints(group.firstRow).map((string, index) => {
      if( Object.keys(this.filterGetObj(covariates,string)).length > 0 ){
        this.setStepIO(
          index,
          group.id,
          0,
          'covariates',
          this.filterGetIndex(covariates,string),
          string
        );
      }
      if( Object.keys(this.filterGetObj(data,string)).length > 0 ){
        this.setStepIO(
          index,
          group.id,
          0,
          'data',
          this.filterGetIndex(data,string),
          string
        );
      }
    });
  }

  removeFileGroup(groupId) {
    return () => {
      const groups = { ...this.props.collection.fileGroups };
      delete groups[groupId];

      // Props delete assocCons featuring groupId
      this.props.unmapAssociatedConsortia(this.props.collection.associatedConsortia)
      .then(() => {
        this.props.updateCollection(
          {
            fileGroups: { ...groups },
            associatedConsortia: [],
          },
          this.props.saveCollection
        );
      });
    };
  }

  setStepIO(i, groupId, stepIndex, objKey, index, string) {
    const { collection, rowArray, updateConsortiumClientProps } = this.props;
    let array = rowArray;
    let timeout = ((i + 1) * 250);
    let varObject = [{
      'collectionId': collection.id,
      'groupId': groupId,
      'column':  string
      }]
      setTimeout(() => {
        updateConsortiumClientProps(stepIndex, objKey, index, varObject);
        array.splice( array.indexOf(string), 1 );
        this.props.setRowArray(array);
      }, timeout);
  }

  updateNewFileOrg(ev) {
    this.setState({ newFile: { ...this.state.newFile, org: ev.target.value } });
  }

  updateMapsStep(){
    this.props.updateMapsStep(true);
  }

  makePoints = ((str) => {
    str = str.split(", ");
    return str.sort();
  });

  render() {
    let {
      activeConsortium,
      collection,
      isMapped,
      saveCollection,
      rowArray,
      rowArrayLength,
    } = this.props;

    let {
      contChildren
    } = this.state;

    return (
      <div>
        <Form onSubmit={saveCollection}>
          {!isMapped &&
            <div>
              <Button
                block
                bsStyle="primary"
                onClick={this.addFileGroup}
              >
                Add Files Group
              </Button>
              <hr />
            </div>
          }
          {this.state.filesError &&
            <Alert bsStyle="danger" style={{ ...styles.topMargin, textAlign: 'left', bottomMargin: 20 }}>
              <h4 style={{ fontStyle: 'normal' }}>File Error</h4>
              {this.state.filesError}
            </Alert>
          }

          {collection.fileGroups &&
            Object.values(collection.fileGroups).map(group => (
            <Panel key={`${group.date}-${group.extension}-${group.id}`}>
              {group.org === 'metafile' &&
                <div>
                  {!isMapped &&
                    <Button
                      bsStyle="danger"
                      className="pull-right"
                      onClick={this.removeFileGroup(group.id)}
                    >
                      <span
                        aria-hidden="true"
                        className="glyphicon glyphicon-trash"
                      /> Remove File Group
                    </Button>
                  }
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
                  {rowArray.length > 0 &&
                  <div className="card-deck" ref="Container">
                    {rowArray && rowArray.map((point, index) => (
                      <div
                        className={"card-draggable card-"+point.toLowerCase()}
                        data-filegroup={group.id}
                        data-string={point}
                        key={index}
                      >
                        <span className="glyphicon glyphicon-file" /> {point}
                      </div>
                    ))}
                  </div>
                  }
                  <hr />
                  <div>
                    {!isMapped && contChildren !== 0 &&
                    <Button
                      block
                      bsStyle="primary"
                      onClick={() => this.autoMap(group)}
                    > Auto Map
                    </Button>
                    }
                    {!isMapped && contChildren === 0 &&
                    <Button
                      block
                      bsStyle="success"
                      onClick={() => this.props.saveAndCheckConsortiaMapping()}
                    > Save
                    </Button>
                    }
                    {isMapped &&
                      <div>
                        <div className="alert alert-success" role="alert">
                          Mapping Complete!
                        </div>
                        <br />
                        <LinkContainer to='/dashboard/consortia'>
                          <Button
                            block
                            bsStyle="success"
                          >Back to Consortia
                          </Button>
                        </LinkContainer>
                      </div>
                    }
                  </div>
                </div>
              }
            </Panel>
          ))}
        </Form>
      </div>
    );
  }
}

MapsCollection.propTypes = {
  collection: PropTypes.object,
  saveCollection: PropTypes.func.isRequired,
  saveAndCheckConsortiaMapping: PropTypes.func.isRequired,
  updateConsortiumClientProps: PropTypes.func.isRequired,
  unmapAssociatedConsortia: PropTypes.func.isRequired,
};

MapsCollection.defaultProps = {
  collection: null,
};

export default connect(null, { unmapAssociatedConsortia })(MapsCollection);
