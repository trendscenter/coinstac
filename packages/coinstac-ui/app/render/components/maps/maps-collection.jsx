import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import Icon from '@material-ui/core/Icon';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import DeleteIcon from '@material-ui/icons/Delete';
import ipcPromise from 'ipc-promise';
import PropTypes from 'prop-types';
import shortid from 'shortid';
import { unmapAssociatedConsortia } from '../../state/ducks/collections';
import bitap from 'bitap';
import classNames from 'classnames';

const styles = theme => ({
  addFileGroupButton: {
    marginTop: theme.spacing.unit,
    marginBottom: theme.spacing.unit,
  },
  removeFileGroupButton: {
    marginTop: theme.spacing.unit,
    marginBottom: theme.spacing.unit,
  },
  rootPaper: {
    ...theme.mixins.gutters(),
    paddingTop: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 2,
    marginTop: theme.spacing.unit * 2,
    height: '100%',
  },
  fileErrorPaper: {
    ...theme.mixins.gutters(),
    paddingTop: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2,
    backgroundColor: '#fef7e4',
    textAlign: 'center',
  },
  fileErrorMessage: {
    color: '#ab8e6b',
  },
  fileList: {
    backgroundColor: '#efefef',
    padding: '1rem',
    borderRadius: '0.25rem'
  },
  fileListItem: {
    whiteSpace: 'nowrap',
    fontSize: '0.75rem',
    margin: '0.25rem'
  },
  actionsContainer: {
    marginTop: theme.spacing.unit * 2,
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

class MapsCollection extends Component {

  constructor(props) {
    super(props);

    this.state = {
      autoMap: false,
      contChildren: 0,
      filesError: null,
      newFile: {
        open: false,
        org: 'metafile',
      },
      showFiles: {},
      source: {},
      finishedAutoMapping: false,
      stepsMapped: -1,
    };

    this.addFileGroup = this.addFileGroup.bind(this);
    this.addFolderGroup = this.addFolderGroup.bind(this);
    this.removeFileGroup = this.removeFileGroup.bind(this);
    this.updateNewFileOrg = this.updateNewFileOrg.bind(this);
    this.updateMapsStep = this.updateMapsStep.bind(this);
    this.setStepIO = this.setStepIO.bind(this);
  }

  componentDidUpdate(prevProps,prevState) {
    if(this.refs.Container){
      let children = 0;
      let Container = ReactDOM.findDOMNode(this.refs.Container);
      children = Container.children.length;
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
          let headerArray = obj.metaFile[0];
          this.props.setRowArray([...headerArray]);
          this.props.setMetaRow([...headerArray]);
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

        this.props.setRowArray(obj.metaFile[0]);

        newFiles = {
          ...obj,
          name,
          id: fileGroupId,
          date: new Date().getTime(),
          firstRow: obj.metaFile[0].join(', '),
          org: this.state.newFile.org,
        };

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

  addFolderGroup() {
    ipcPromise.send('open-dialog')
    .then((obj) => {

      let newFiles;

      const fileGroupId = shortid.generate();

      if (obj.error) {
        this.setState({ filesError: obj.error });
      } else {
        const name = `Group ${Object.keys(this.props.collection.fileGroups).length + 1} (${obj.extension.toUpperCase()})`;

        let type = this.props.activeConsortium.pipelineSteps[0].dataMeta.items[0];

        this.props.setRowArray([type]);
        this.props.setMetaRow([type]);

        newFiles = {
          name,
          id: fileGroupId,
          extension: obj.extension,
          files: [...obj.paths],
          date: new Date().getTime(),
          firstRow: type
        };

        this.setState({ showFiles: { [newFiles.date]: false } });
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

  changeMetaRow(search, string){
    return new Promise((resolve, reject) => {
      const {
        metaRow,
        setMetaRow,
      } = this.props;
      let marray = metaRow;
      let index = marray.indexOf(string);
      if(index === 0){
        marray[index] = 'id';
      }
      if(index !== 0 && index !== -1){
        marray[index] = search;
      }
      setMetaRow(marray);
      resolve(true);
    });
  }

  changeMetaGetObj(search, string, obj, key){
    let changeMeta = this.changeMetaRow(search, string);
    return changeMeta.then((r) => {
      if(r){
        return obj[key];
      }
    });
  }

  findInObject = (obj, string, type, method) => {
     return Object.entries(obj).find(([key, value]) => {
       let search = null;
       let name = obj['name'];
       let itemtype = obj['type'];
       if(!name && itemtype){
         search = itemtype;
       }else if(name && itemtype){
         search = name;
       }
       if(search !== null && search !== 'undefined'){
         //Match data column and map to ID
         if(type === 'data'
         && string.toLowerCase() === 'id'){
           return this.changeMetaGetObj(search, string, obj, key);
         }

         //Match if string and search are equal
         if( string.toLowerCase() === search.toLowerCase() ){
           return this.changeMetaGetObj(search, string, obj, key);
         }

         //Match if string contains search and vice versa
         if(string.length < search.length){
           let sch = search.replace(/[_-\s]/g, ' ');
           sch = sch.toLowerCase();
           string = string.toLowerCase();
           if(sch.includes(string)){
             return this.changeMetaGetObj(search, string, obj, key);
           }
         }else{
           let str = string.replace(/[_-\s]/gi, ' ');
           search = search.toLowerCase();
           str = str.toLowerCase();
           if(str.includes(search)){
             return this.changeMetaGetObj(search, string, obj, key);
           }
         }

         //Finally Fuzzy match string to search based on which is larger
         let fuzzy = [];
         let str = string.replace(/[_-\s]/gi, '');
         let sch = search.replace(/[_-\s]/gi, '');
         if(str.length > sch.length){
           fuzzy = bitap(str.toLowerCase(), sch.toLowerCase(), 1);
         }else{
           fuzzy = bitap(sch.toLowerCase(), str.toLowerCase(), 1);
         }
         if(fuzzy.length > 1 && fuzzy[0] > 3){
           return this.changeMetaGetObj(search, string, obj, key);
         }
         if(type === 'data'
         && string.toLowerCase() === 'id'){
           return this.changeMetaGetObj(search, string, obj, key);
         }
       }
     });
  }

  filterGetObj(arr, string, type) {
    return arr.filter((obj) => {
       return this.findInObject(obj, string, type, 'getObj');
    });
  }

  filterGetIndex(arr, string, type) {
    return new Promise((resolve, reject) => {
       let result = arr.findIndex((obj) => {
         return this.findInObject(obj, string, type, 'getIndex');
       });
       resolve(result);
    });
  }

  async autoMap(group) {
     this.setState({ autoMap: true });
     let inputMap = this.props.activeConsortium.pipelineSteps[0].inputMap;
     let resolveAutoMapPromises = Object.entries(inputMap).map((item, i) => {
       let type = item[0];
       let obj = item[1].ownerMappings;
       let firstRow = this.makePoints(group.firstRow);
       const steps = firstRow.map(async (string, index) => {
       if( obj && Object.keys(this.filterGetObj(obj,string,type)).length > 0 ){
         firstRow.filter(e => e !== string);
         let setObj = this.filterGetIndex(obj,string,type);
         await setObj.then((result) => {
           this.setStepIO(
             index,
             group.id,
             0,
             type,
             result,
             string
           );
         });
        }
       });
       return Promise.all(steps);
     });
     await Promise.all(resolveAutoMapPromises);
     this.setState({ finishedAutoMapping: true });
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

  setStepIO(i, groupId, stepIndex, search, index, string) {
    const {
      collection,
      metaRow,
      rowArray,
      setRowArray,
      updateConsortiumClientProps
    } = this.props;
    return new Promise((resolve) => {
      let firstRow = collection.fileGroups[groupId].firstRow;
      let newFirstRow = firstRow.split(', ');
      let dex = newFirstRow.indexOf(string);
      let name = metaRow[dex];
      let varObject = [{
        'collectionId': collection.id,
        'groupId': groupId,
        'column':  name
      }];
      updateConsortiumClientProps(stepIndex, search, index, varObject);
      rowArray.splice( rowArray.indexOf(string), 1 );
      setRowArray(rowArray);
      resolve();
    })
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
    const {
      activeConsortium,
      collection,
      classes,
      dataType,
      isMapped,
      metaRow,
      rowArray,
      rowArrayLength,
      saveCollection,
      stepsTotal,
      stepsMapped,
    } = this.props;

    const {
      autoMap,
      contChildren,
      filesError,
      finishedAutoMapping,
    } = this.state;

    let dataType = 'meta';
    if(this.props.activeConsortium.pipelineSteps[0]
      && this.props.activeConsortium.pipelineSteps[0].dataMeta){
      dataType = this.props.activeConsortium.pipelineSteps[0].dataMeta.type;
    }
    
    return (
      <div>
        <form onSubmit={saveCollection}>
          {
            !isMapped
            && dataType === 'meta'
	          && (
              <div>
                <Button
                  variant="contained"
                  color="primary"
                  className={classes.addFileGroupButton}
                  onClick={this.addFileGroup}
                >
                  Add Files Group
                </Button>
                <Divider />
              </div>
            )
          }
          {
            !isMapped
            && dataType === 'directory'
            && (
              <div>
                <Button
                  variant="contained"
                  color="primary"
                  className={classes.addFileGroupButton}
                  onClick={this.addFolderGroup}
                >
                  Add Files from Folder
                </Button>
                <Divider />
              </div>
            )
          }
	  {
	    filesError
            && (
              <Paper className={classes.fileErrorPaper}>
                <Typography variant="h6" className={classes.fileErrorMessage}>File Error</Typography>
                <Typography className={classes.fileErrorMessage} variant="body1">
                  {filesError}
                </Typography>
              </Paper>
            )
          }

          {
            collection.fileGroups
            && Object.values(collection.fileGroups).map(group => (
              <Paper
                key={`${group.date}-${group.extension}-${group.id}`}
                className={classes.rootPaper}
              >
                <div>
                  {
                    !isMapped
                    && (
                      <Button
                        variant="contained"
                        color="secondary"
                        className={classes.removeFileGroupButton}
                        onClick={this.removeFileGroup(group.id)}
                      >
                        <DeleteIcon />
                        Remove File Group
                      </Button>
                    )
                  }
                  <Typography>
                    <span className="bold">Name:</span> {group.name}
                  </Typography>
                  <Typography>
                    <span className="bold">Date:</span> {new Date(group.date).toUTCString()}
                  </Typography>
                  <Typography>
                    <span className="bold">Extension:</span> {group.extension}
                  </Typography>
                   {group.org === 'metafile'
                    && (
                      <div>
                        <Typography>
                          <span className="bold">Meta File Path:</span> {group.metaFilePath}
                        </Typography>
                        <Typography>
                          <span className="bold">Original MetaFile Header:</span> {group.firstRow}
                        </Typography>
                        <Typography>
                          <span className="bold">Mapped MetaFile Header:</span> {metaRow.toString()}
                        </Typography>
                        <Typography>
                          <span className="bold">Items Mapped:</span> {stepsMapped} of {stepsTotal}
                        </Typography>
                      </div>
                      )
                    }
                    {group.org !== 'metafile'
                      && (
                        <div>
                          <Typography>
                            <span className="bold">File(s):</span>
                          </Typography>
                          <div className={classes.fileList}>
                            {group.files.map((file, i) => {
                              return(
                                <div className={classes.fileListItem}>
                                  ({i+1}){file}
                                </div>)
                            })}
                          </div>
                        </div>
                      )
                    }
                    <div>
                      {group
                        && rowArray.length > 0
                        && (
                          <div className="card-deck" ref="Container">
                            {
                              rowArray && rowArray.map((point, index) => (
                                <div
                                  className={`card-draggable card-${point.toLowerCase()}`}
                                  data-filegroup={group.id}
                                  data-string={point}
                                  key={index}
                                >
                                  <FileCopyIcon />
                                  {point}
                                  {dataType !== 'meta' ? ' Bundle ('+group.files.length+' files)' : ''}
                                  <span onClick={()=>{this.props.removeRowArrItem(point)}}>
                                    <Icon
                                      className={classNames('fa fa-times-circle', classes.timesIcon)} />
                                  </span>
                                </div>
                              ))
                            }
                          </div>
                        )
                      }
                      </div>
                      <Divider />
                      <div className={classes.actionsContainer}>
                        {
                          !isMapped
                          && rowArray.length > 1
                          && rowArray.length * contChildren > 0
                          && (
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={() => this.autoMap(group)}
                            >
                              Auto Map
                            </Button>
                          )
                        }
                        {
                          !isMapped
                          && rowArray.length > 0
                          && stepsTotal === stepsMapped
                          &&  <Button
                                variant="contained"
                                style={{
                                  backgroundColor: '#5cb85c',
                                  color: '#fff',
                                }}
                                onClick={() => this.props.saveAndCheckConsortiaMapping()}
                              >
                                Remove Extra Items
                              </Button>
                        }
                        {
                          !isMapped
                          && rowArray.length === 0
                          && stepsTotal === stepsMapped
                          &&  <Button
                                variant="contained"
                                style={{
                                  backgroundColor: '#5cb85c',
                                  color: '#fff',
                                }}
                                onClick={() => this.props.saveAndCheckConsortiaMapping()}
                              >
                                Save
                              </Button>
                        }
                        {
                          !isMapped
                          && this.makePoints(group.firstRow).length !== rowArrayLength
                          && <Button
                            style={{marginLeft: '1rem'}}
                            variant="contained"
                            color="secondary"
                            onClick={() => {
                              this.props.resetPipelineSteps(this.makePoints(group.firstRow));
                              this.setState({autoMap: false, stepsMapped: 0});
                            }}
                          >
                            Reset
                          </Button>
                        }
                        {
                          isMapped
                          && (
                            <div>
                              <div className="alert alert-success" role="alert">
                                Mapping Complete!
                              </div>
                              <br />
                              <Button
                                variant="contained"
                                color="primary"
                                to="/dashboard/consortia"
                                component={Link}
                              >
                                Back to Consortia
                              </Button>
                            </div>
                          )
                        }
                     </div>
                </div>
              </Paper>
            ))
          }
        </form>
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
  classes: PropTypes.object.isRequired,
};

MapsCollection.defaultProps = {
  collection: null,
};

const connectedComponent = connect(null, { unmapAssociatedConsortia })(MapsCollection);

export default withStyles(styles)(connectedComponent);
