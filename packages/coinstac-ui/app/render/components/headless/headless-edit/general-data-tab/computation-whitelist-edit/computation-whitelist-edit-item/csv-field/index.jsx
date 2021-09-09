/* eslint-disable react/no-array-index-key */
import React from 'react';
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

function CsvField({ editWhitelist, whitelistData }) {
  function addColumnMap() {
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
  }

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
                </TableRow>
              ))}
          </TableBody>
        </Table>
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
