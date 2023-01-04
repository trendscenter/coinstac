import React from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import update from 'immutability-helper';

class PipelineStepInputFilesTableRow extends React.Component {
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
      obj, index, objKey, objParams, owner, possibleInputs, step, updateStep,
    } = this.props;

    const { openDataMenu } = this.state;

    return (
      <TableRow>
        <TableCell>
          <Button
            id={`${objKey}-${index}-data-dropdown`}
            variant="contained"
            color="secondary"
            disabled={!owner}
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
          <Button
            variant="contained"
            color="secondary"
            disabled={!owner || !obj.type}
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

PipelineStepInputFilesTableRow.defaultProps = {
  possibleInputs: null,
};

PipelineStepInputFilesTableRow.propTypes = {
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

export default PipelineStepInputFilesTableRow;
