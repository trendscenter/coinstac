/* eslint-disable react/no-array-index-key */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Input from '@material-ui/core/Input';
import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableBody from '@material-ui/core/TableBody';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import Typography from '@material-ui/core/Typography';
import makeStyles from '@material-ui/core/styles/makeStyles';
import { get, intersection } from 'lodash';

const useStyles = makeStyles(theme => ({
  columnsInput: {
    flex: 1,
  },
  error: {
    color: theme.palette.error.main,
  },
}));

function CsvField({ editWhitelist, whitelistData }) {
  const classes = useStyles();

  const [columns, setColumns] = useState('');
  const [columnsError, setColumnsError] = useState('');

  const addColumnMap = () => {
    const changes = {
      ...whitelistData,
      type: 'csv',
      dataMap: [{}],
    };

    if (whitelistData && whitelistData.dataMap) {
      changes.dataMap = [
        ...whitelistData.dataMap,
        {},
      ];
    }

    editWhitelist(changes);
  };

  const validateColumns = () => {
    const columnNames = columns.split(',').map(columnName => columnName.trim());

    const hasEmptyColumnName = columnNames.filter(columnName => !columnName).length > 0;
    if (hasEmptyColumnName) {
      setColumnsError('Has empty column name');
      return true;
    }

    const existingColumnNames = get(whitelistData, 'dataMap', []).map(columnData => columnData.csvColumn);
    if (existingColumnNames.length > 0) {
      const duplicateNames = intersection(columnNames, existingColumnNames);

      if (duplicateNames.length > 0) {
        setColumnsError(`Has columns already mapped: ${duplicateNames.join(', ')}`);
        return true;
      }
    }

    return false;
  };

  const addMultipleColumnMap = () => {
    const hasError = validateColumns();
    if (hasError) {
      return;
    }

    const changes = {
      ...whitelistData,
      type: 'csv',
      dataMap: [{}],
    };

    if (whitelistData && whitelistData.dataMap) {
      const columnNames = columns.split(',').map(columnName => columnName.trim());

      changes.dataMap = [
        ...whitelistData.dataMap,
        ...columnNames.map(columnName => ({
          csvColumn: columnName,
          variableName: columnName,
          type: 'string',
        })),
      ];
    }

    setColumns('');

    editWhitelist(changes);
  };

  const editColumnMap = (fieldName, index) => (e) => {
    const changes = {
      ...whitelistData,
      type: 'csv',
      dataMap: [
        ...whitelistData.dataMap,
      ],
    };

    changes.dataMap[index] = {
      ...changes.dataMap[index],
      [fieldName]: e.target.value,
    };

    editWhitelist(changes);
  };

  const editField = fieldName => (e) => {
    editWhitelist({
      ...whitelistData,
      type: 'csv',
      [fieldName]: e.target.value,
    });
  };

  const handleColumnsChange = (evt) => {
    const { value } = evt.target;
    setColumns(value);
    setColumnsError('');
  };

  const handleDeleteColumnMap = (index) => {
    editWhitelist({
      ...whitelistData,
      dataMap: whitelistData.dataMap.filter((_, idx) => idx !== index),
    });
  };

  return (
    <Box>
      <Box>
        <Typography variant="h6">Data File Path</Typography>
        <Input
          placeholder="Data File Path"
          value={whitelistData && whitelistData.dataFilePath ? whitelistData.dataFilePath : ''}
          onChange={editField('dataFilePath')}
          fullWidth
        />
      </Box>

      <Box marginTop={2}>
        <Typography variant="h6">CSV Column mapping</Typography>

        <Box marginTop={2} width="100%" display="flex" alignItems="center" gridColumnGap={24}>
          <Input
            className={classes.columnsInput}
            placeholder="Please input comma separated column names"
            value={columns}
            error={Boolean(columnsError)}
            onChange={handleColumnsChange}
          />
          <Button
            variant="contained"
            color="secondary"
            disabled={!columns}
            onClick={addMultipleColumnMap}
          >
            Add multiple
          </Button>
        </Box>
        {columnsError && (
          <Typography className={classes.error}>{columnsError}</Typography>
        )}

        <Box marginTop={2}>
          <Button
            variant="contained"
            color="secondary"
            onClick={addColumnMap}
          >
            Add column map
          </Button>

          <Table>
            <TableHead>
              <TableRow>
                <TableCell>CSV Column</TableCell>
                <TableCell>Pipeline Variable name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {whitelistData && whitelistData.dataMap
                && whitelistData.dataMap.map((columnData, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Input placeholder="CSV Column" value={columnData.csvColumn || ''} onChange={editColumnMap('csvColumn', index)} />
                    </TableCell>
                    <TableCell>
                      <Input placeholder="Pipeline Variable Name" value={columnData.variableName || ''} onChange={editColumnMap('variableName', index)} />
                    </TableCell>
                    <TableCell>
                      <Input placeholder="Type" value={columnData.type || ''} onChange={editColumnMap('type', index)} />
                    </TableCell>
                    <TableCell>
                      <Button variant="contained" color="secondary" onClick={() => handleDeleteColumnMap(index)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Box>
      </Box>
    </Box>
  );
}

CsvField.defaultProps = {
  whitelistData: null,
};

CsvField.propTypes = {
  editWhitelist: PropTypes.func.isRequired,
  whitelistData: PropTypes.object,
};

export default CsvField;
