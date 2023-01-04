import React from 'react';
import PropTypes from 'prop-types';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Tooltip from '@material-ui/core/Tooltip';
import InfoIcon from '@material-ui/icons/Info';
import update from 'immutability-helper';

const VAULT_USER_SUGGESTED_FIELD_TOOLTIP = `
  This field is present on the vault users with this name. If you delete this field, the vault user won't be able to provide
  data for it.
`;

class PipelineStepInputCsvTableRow extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      openDataMenu: false,
    };

    this.openDataMenu = this.openDataMenu.bind(this);
    this.closeDataMenu = this.closeDataMenu.bind(this);
  }

  selectData = (value, index) => () => {
    const { updateStep, getNewObj, step } = this.props;

    updateStep({
      ...step,
      inputMap: getNewObj(
        'type',
        value,
        index
      ),
    });

    this.closeDataMenu();
  }

  openDataMenu(event) {
    this.dataButtonElement = event.currentTarget;
    this.setState({ openDataMenu: true });
  }

  closeDataMenu() {
    this.setState({ openDataMenu: false });
  }

  render() {
    const {
      obj, index, objKey, objParams, owner, getNewObj, possibleInputs, step, updateStep,
    } = this.props;

    const { openDataMenu } = this.state;

    return (
      <TableRow>
        <TableCell>
          <Button
            id={`${objKey}-${index}-data-dropdown`}
            variant="contained"
            color="secondary"
            disabled={!owner || obj.suggested}
            onClick={this.openDataMenu}
          >
            {
              obj.type
              || (
                obj.fromCache && possibleInputs.length
                  ? possibleInputs[obj.fromCache.step].inputs[obj.fromCache.variable].type
                  : false
              )
              || 'Data Type'
            }
          </Button>
          <Menu
            anchorEl={this.dataButtonElement}
            open={openDataMenu}
            onClose={this.closeDataMenu}
            id={`${objKey}-${index}-data-dropdown-menu`}
          >
            {
              objParams.items.map(item => (
                <MenuItem
                  key={`${item}-menuitem`}
                  onClick={this.selectData(item, index)}
                >
                  {item}
                </MenuItem>
              ))
            }
          </Menu>
        </TableCell>
        <TableCell>
          {
            !obj.fromCache && (
              <Box display="flex" alignItems="center">
                <TextField
                  id={`${objKey}-${index}-input-name`}
                  disabled={!owner || obj.suggested}
                  placeholder="Variable Name"
                  value={obj.name || ''}
                  onChange={event => updateStep({
                    ...step,
                    inputMap: getNewObj('name', event.target.value, index),
                  })}
                />
                {
                  obj.suggested && (
                    <Tooltip
                      title={
                        <Typography variant="body1">{ VAULT_USER_SUGGESTED_FIELD_TOOLTIP }</Typography>
                      }
                    >
                      <InfoIcon />
                    </Tooltip>
                  )
                }
              </Box>
            )
          }
          {
            obj.fromCache && possibleInputs.length > 0
            && (
              <Typography variant="subtitle1">
                Variable:
                  {` ${possibleInputs[obj.fromCache.step].inputs[obj.fromCache.variable].label}`}
              </Typography>
            )
          }
        </TableCell>
        <TableCell>
          <Button
            variant="contained"
            color="secondary"
            disabled={!owner}
            onClick={() => updateStep({
              ...step,
              inputMap: {
                ...step.inputMap,
                [objKey]: {
                  value: update(step.inputMap[objKey].value, {
                    $splice: [[index, 1]],
                  }),
                },
              },
            })}
          >
            Remove
          </Button>
        </TableCell>
      </TableRow>
    );
  }
}

PipelineStepInputCsvTableRow.defaultProps = {
  possibleInputs: null,
};

PipelineStepInputCsvTableRow.propTypes = {
  obj: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  objKey: PropTypes.string.isRequired,
  objParams: PropTypes.object.isRequired,
  owner: PropTypes.bool.isRequired,
  step: PropTypes.object.isRequired,
  getNewObj: PropTypes.func.isRequired,
  updateStep: PropTypes.func.isRequired,
  possibleInputs: PropTypes.array,
};

export default PipelineStepInputCsvTableRow;
