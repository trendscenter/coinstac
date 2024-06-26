import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import red from '@material-ui/core/colors/red';
import Grid from '@material-ui/core/Grid';
import { withStyles } from '@material-ui/core/styles';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import InfoIcon from '@material-ui/icons/Info';
import Alert from '@material-ui/lab/Alert';
import PropTypes from 'prop-types';
import React from 'react';
import dragula from 'react-dragula';

import mapVariablesToColumns from '../../../utils/csv-column-auto-map';
import { readCsvFreesurferFiles } from '../../../utils/helpers';
import FilePicker from '../../common/file-picker';
import MapsCsvFieldCsvHeader from './maps-csv-field-csv-header';
import MapsCsvFieldPipelineVariable from './maps-csv-field-pipeline-variable';

const styles = theme => ({
  rootPaper: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    paddingTop: theme.spacing(1.5),
    paddingBottom: theme.spacing(1.5),
    marginTop: theme.spacing(1.5),
    [theme.breakpoints.up('sm')]: {
      paddingLeft: theme.spacing(3),
      paddingRight: theme.spacing(3),
    },
  },
  header: {
    textTransform: 'capitalize',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  capitalize: {
    textTransform: 'capitalize',
  },
  subtitle: {
    marginTop: theme.spacing(4),
    marginBottom: theme.spacing(2),
  },
  autoMapContainer: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
  },
  autoMap: {
    marginRight: theme.spacing(1),
  },
  errorMessage: {
    color: red[400],
  },
  alert: {
    marginBottom: theme.spacing(1),
  },
});

const drake = dragula({
  copy: true,
  copySortSource: true,
  revertOnSpill: true,
});

const filePickerTooltip = 'Select one or more csv files and then map the csv columns to the pipeline variables';
const autoMapTooltip = 'The system will try to map the csv columns to the pipeline variables automatically';

class MapsCsvField extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      remainingHeader: [],
      selectedFiles: [],
      autoMapError: false,
    };

    this.autoMap = this.autoMap.bind(this);
    this.onDrop = this.onDrop.bind(this);
    this.setInitialState = this.setInitialState.bind(this);
    this.setSelectedFiles = this.setSelectedFiles.bind(this);
    this.appendSelectedFiles = this.appendSelectedFiles.bind(this);
    this.deleteFile = this.deleteFile.bind(this);
    this.unmapField = this.unmapField.bind(this);
  }

  componentDidMount() {
    drake.on('drop', this.onDrop);

    const { fieldDataMap } = this.props;

    if (fieldDataMap) {
      this.setInitialState(fieldDataMap);
    }
  }

  onDrop(fileDataMappingElement, targetPipelineElement) {
    const pipelineVariableName = targetPipelineElement.dataset.name;
    const columnName = fileDataMappingElement.dataset.string;

    if (!pipelineVariableName) {
      return;
    }

    const {
      fieldName, onChange, fieldDataMap, fieldDescription,
    } = this.props;

    this.setState(prevState => ({
      remainingHeader: prevState.remainingHeader.filter(column => column !== columnName),
    }));

    onChange(fieldName, {
      ...fieldDataMap,
      maps: {
        ...fieldDataMap.maps,
        [pipelineVariableName]: columnName,
      },
      fieldType: fieldDescription.type,
    });

    fileDataMappingElement.remove();
  }

  setSelectedFiles(selectedFiles) {
    const {
      onChange, fieldName, fieldDataMap, fieldDescription,
    } = this.props;

    const readFiles = async () => {
      const parsedFiles = await readCsvFreesurferFiles(selectedFiles);

      const header = new Set();
      parsedFiles.forEach(file => file.header.forEach(headerColumn => header.add(headerColumn)));

      let headerArray = [...header];

      if (fieldDataMap && fieldDataMap.maps) {
        const mappedColumns = Object.values(fieldDataMap.maps);
        headerArray = headerArray.filter(col => !mappedColumns.includes(col));
      }

      this.setState({
        remainingHeader: headerArray,
        selectedFiles,
      });

      onChange(fieldName, {
        fileData: parsedFiles,
        files: selectedFiles,
        maps: fieldDataMap && fieldDataMap.maps ? fieldDataMap.maps : {},
        fieldType: fieldDescription.type,
      });
    };

    readFiles();
  }

  getUnmappedFieldsWarningMessage = () => {
    const { field, fieldDataMap } = this.props;

    if (!fieldDataMap) {
      return 'All fields are unmapped.';
    }

    const unmappedFields = field.value
      .map(pipelineVariable => pipelineVariable.name)
      .filter(name => !fieldDataMap.maps[name]);

    if (unmappedFields.length === 0) {
      return null;
    }

    if (unmappedFields.length === field.value.length) {
      return 'All fields are unmapped.';
    }

    if (unmappedFields.length === 1) {
      return `${unmappedFields[0]} is unmapped.`;
    }

    if (unmappedFields.length === 2) {
      return `${unmappedFields.join(', ')} are unmapped.`;
    }

    return `${unmappedFields.slice(0, unmappedFields.length - 1).join(', ')}
      and ${unmappedFields[unmappedFields.length - 1]} are unmapped.`;
  }

  setInitialState(fieldDataMap) {
    if (fieldDataMap.files) {
      this.setSelectedFiles(fieldDataMap.files);
    }
  }

  appendSelectedFiles(selectedFiles) {
    if (!selectedFiles || !selectedFiles.length) return;

    const { fieldDataMap } = this.props;

    let files;
    if (fieldDataMap && fieldDataMap.files && fieldDataMap.files.length > 0) {
      files = fieldDataMap.files.concat(selectedFiles);
    } else {
      files = selectedFiles;
    }

    this.setSelectedFiles(files);
  }

  deleteFile(fileIndex) {
    const { fieldDataMap } = this.props;

    const newFiles = fieldDataMap.files.filter((f, i) => i !== fileIndex);
    this.setSelectedFiles(newFiles);
  }

  unmapField(pipelineFieldName, columnName) {
    const { fieldName, fieldDataMap, onChange } = this.props;

    onChange(fieldName, {
      ...fieldDataMap,
      maps: {
        ...fieldDataMap.maps,
        [pipelineFieldName]: null,
      },
    });

    this.setState(prevState => ({
      remainingHeader: [...prevState.remainingHeader, columnName],
    }));
  }

  autoMap() {
    const {
      fieldName, field, fieldDataMap, onChange,
    } = this.props;

    const { remainingHeader } = this.state;

    const pipelineVariablesNames = field.value.map(v => v.name);

    const map = mapVariablesToColumns(pipelineVariablesNames, remainingHeader);

    if (!map) {
      this.setState({ autoMapError: true });
    } else {
      const autoMap = map.reduce((acc, mapLine) => {
        acc[mapLine.variable] = mapLine.column;

        return acc;
      }, {});

      const mapColumns = map.map(elem => elem.column);

      this.setState(prevState => ({
        remainingHeader: prevState.remainingHeader.filter(column => !mapColumns.includes(column)),
      }));

      onChange(fieldName, {
        ...fieldDataMap,
        maps: {
          ...fieldDataMap.maps,
          ...autoMap,
        },
      });
    }
  }

  render() {
    const {
      fieldName, field, fieldDataMap, fieldDescription, classes,
    } = this.props;

    const { remainingHeader, selectedFiles, autoMapError } = this.state;

    const unmappedFieldsWarningMessage = this.getUnmappedFieldsWarningMessage();

    return (
      <div>
        <Typography variant="h4" className={classes.header}>
          {fieldName}
        </Typography>
        <FilePicker
          multiple
          filterName="csv"
          extensions={fieldDescription.extensions}
          selected={fieldDataMap && fieldDataMap.files ? fieldDataMap.files : []}
          onChange={files => this.appendSelectedFiles(files)}
          deleteItem={fileIndex => this.deleteFile(fileIndex)}
          tooltip={filePickerTooltip}
        />
        {
          selectedFiles.length > 0 && (
            <>
              <Typography variant="h5" className={classes.subtitle}>
                Map CSV columns to pipeline variables
              </Typography>
              <div className={classes.autoMapContainer}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={this.autoMap}
                  disabled={remainingHeader.length === 0 || autoMapError}
                  className={classes.autoMap}
                >
                  Auto Map
                </Button>

                <Tooltip
                  title={
                    <Typography variant="body1">{ autoMapTooltip }</Typography>
                  }
                >
                  <InfoIcon />
                </Tooltip>
              </div>
              {
                autoMapError && (
                  <Typography variant="body1" className={classes.errorMessage}>
                    The system could not map the columns automatically. Please drag and drop the
                    csv columns to the corresponding variables.
                  </Typography>
                )
              }
              {unmappedFieldsWarningMessage && (
                <Alert severity="error" className={classes.alert}>
                  { unmappedFieldsWarningMessage }
                </Alert>
              )}
              <Grid container spacing={6}>
                <Grid item xs={12}>
                  <MapsCsvFieldCsvHeader
                    remainingHeader={remainingHeader}
                    registerDraggableContainer={container => drake.containers.push(container)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box display="flex" flexDirection="column" gridGap={16}>
                    <Typography variant="h6" className={classes.capitalize}>
                      { `Pipeline ${fieldName}` }
                    </Typography>
                    {
                      field.value.map(pipelineVariable => (
                        <MapsCsvFieldPipelineVariable
                          key={pipelineVariable.name}
                          name={pipelineVariable.name}
                          dataType={pipelineVariable.type}
                          mappedColumn={fieldDataMap && fieldDataMap.maps[pipelineVariable.name]}
                          registerDraggableContainer={container => drake.containers.push(container)}
                          unmapField={
                            (pipelineFieldName, columnName) => this.unmapField(
                              pipelineFieldName,
                              columnName,
                            )
                          }
                        />
                      ))
                    }
                  </Box>
                </Grid>
              </Grid>
            </>
          )
        }
      </div>
    );
  }
}

MapsCsvField.propTypes = {
  classes: PropTypes.object.isRequired,
  field: PropTypes.object.isRequired,
  fieldDataMap: PropTypes.object,
  fieldName: PropTypes.string.isRequired,
  fieldDescription: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};

MapsCsvField.defaultProps = {
  fieldDataMap: null,
};

export default withStyles(styles)(MapsCsvField);
