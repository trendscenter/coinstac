import Accordion from '@material-ui/core/Accordion';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import PropTypes from 'prop-types';
import React from 'react';
import JSONInput from 'react-json-editor-ajrm';
import locale from 'react-json-editor-ajrm/locale/en';

function JsonField({
  id, name, disabled, onChange, initialValue,
}) {
  return (
    <Accordion>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
      >
        <Typography variant="subtitle2">{ name }</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box width="100%">
          <JSONInput
            onChange={onChange}
            id={id}
            locale={locale}
            height="500px"
            width="100%"
            viewOnly={disabled}
            placeholder={initialValue}
          />
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}

JsonField.defaultProps = {
  disabled: false,
  initialValue: {},
};

JsonField.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  initialValue: PropTypes.object,
};

export default JsonField;
