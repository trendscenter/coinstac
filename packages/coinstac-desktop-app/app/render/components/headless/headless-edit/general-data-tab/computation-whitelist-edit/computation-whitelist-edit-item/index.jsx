import React from 'react';
import PropTypes from 'prop-types';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import DeleteIcon from '@material-ui/icons/Delete';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import CsvField from './csv-field';

function ComputationWhitelistEditItem({
  computation, changeWhitelist, computationWhitelistData, disabled, removeComputation,
}) {
  const { id, meta: { name }, computation: { input } } = computation;

  const memberInputs = Object.keys(input).filter(inputKey => input[inputKey].source === 'member');

  const editWhitelist = fieldKey => (changes) => {
    changeWhitelist(id, {
      inputMap: {
        [fieldKey]: changes,
      },
    });
  };

  function clickDelete() {
    removeComputation(id);
  }

  return (
    <Accordion disabled={disabled}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
      >
        <Typography variant="subtitle2">{ name }</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box width="100%">
          <Box display="flex" justifyContent="flex-end">
            <Button
              variant="contained"
              color="default"
              onClick={clickDelete}
              endIcon={<DeleteIcon />}
            >
              Remove Computation
            </Button>
          </Box>
          {memberInputs && memberInputs.map((inputKey) => {
            const inputField = input[inputKey];

            switch (inputField.type) {
              case 'csv':
                return (
                  <CsvField
                    key={inputKey}
                    field={inputField}
                    editWhitelist={editWhitelist(inputKey)}
                    whitelistData={computationWhitelistData.inputMap[inputKey]}
                  />
                );
              default:
                return null;
            }
          })}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}

ComputationWhitelistEditItem.propTypes = {
  computation: PropTypes.object.isRequired,
  changeWhitelist: PropTypes.func.isRequired,
  computationWhitelistData: PropTypes.object.isRequired,
  removeComputation: PropTypes.func.isRequired,
  disabled: PropTypes.bool.isRequired,
};

export default ComputationWhitelistEditItem;
