import React from 'react';
import PropTypes from 'prop-types';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import CsvField from './csv-field';

function ComputationWhitelistEditItem({ computation, changeWhitelist, computationWhitelistData }) {
  const { id, meta: { name }, computation: { input } } = computation;

  const memberInputs = Object.keys(input).filter(inputKey => input[inputKey].source === 'member');

  const editWhitelist = fieldKey => (changes) => {
    changeWhitelist(id, {
      inputMap: {
        [fieldKey]: changes,
      },
    });
  };

  return (
    <Accordion>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
      >
        <Typography variant="subtitle2">{ name }</Typography>
      </AccordionSummary>
      <AccordionDetails>
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
      </AccordionDetails>
    </Accordion>
  );
}

ComputationWhitelistEditItem.propTypes = {
  computation: PropTypes.object.isRequired,
  changeWhitelist: PropTypes.func.isRequired,
  computationWhitelistData: PropTypes.object.isRequired,
};

export default ComputationWhitelistEditItem;
