import React, { Component, PropTypes } from 'react';
import {
  ControlLabel,
  FormControl,
  FormGroup,
  Table,
} from 'react-bootstrap';
import { tail } from 'lodash';

import ComputationFieldCovariates from '../computation-field-covariates';

export default class ProjectCovariatesMapper extends Component {
  renderHeadingRow() {
    const {
      covariates,
      csv: [row],
      metaCovariateMapping,
      metaCovariateErrors,
      onMapCovariate,
    } = this.props;
    const options = [<option disabled key={0} value={0}>Map column…</option>]
      .concat(covariates.map(({ name, type }, i) => {
        const index = i + 1;
        return (
          <option key={index} value={index}>
            {`${name} (${ComputationFieldCovariates.typeMap.get(type)})`}
          </option>
        );
      }));

    const tableHeadings = [<th key={0}>{row[0]}</th>].concat(
      tail(row).map((heading, i) => {
        const index = i + 1;
        const value = typeof metaCovariateMapping[index] !== 'undefined' ?
          metaCovariateMapping[index] : 0;
        const formGroupProps = {
          bsSize: 'small',
          controlId: `project-covariates-mapper-${index}`,
        };
        let indicator;

        if (Array.isArray(metaCovariateErrors) && metaCovariateErrors[i]) {
          formGroupProps.validationState = 'error';
          indicator = (
            <span className="text-danger">
              <span aria-label="error" className="glyphicon glyphicon-remove">
              </span>
            </span>
          );
        } else if (value !== 0) {
          formGroupProps.validationState = 'success';
          indicator = (
            <span className="text-success">
              <span aria-label="okay" className="glyphicon glyphicon-ok">
              </span>
            </span>
          );
        }

        return (
          <th key={index}>
            <FormGroup {...formGroupProps}>
              <ControlLabel className="sr-only">
                {`Map column "${heading}" to covariate`}
              </ControlLabel>
              <FormControl
                componentClass="select"
                onChange={(event) => {
                  onMapCovariate(index, parseInt(event.target.value, 10));
                }}
                value={value}
              >
                {options}
              </FormControl>
            </FormGroup>
            {heading}
            {indicator}
          </th>
        );
      })
    );

    return <tr>{tableHeadings}</tr>;
  }

  render() {
    const { csv } = this.props;

    const rows = csv.slice(1, 8);

    if (csv.length > 8) {
      rows.push(rows[0].map((r, i) => {
        return i === 0 ? '' : '…';
      }));
    }

    return (
      <div className="project-covariates-mapper">
        <p>Map your meta file’s columns to required computation inputs:</p>
        <Table striped condensed className="project-covariates-mapper">
          <thead>
            {this.renderHeadingRow()}
          </thead>
          <tbody>
            {rows.map((row, i) => {
              return (
                <tr key={i}>
                  {row.map((col, j) => {
                    return <td key={j}>{col.toString()}</td>;
                  })}
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>
    );
  }
}

ProjectCovariatesMapper.propTypes = {
  covariates: PropTypes.array.isRequired,
  csv: PropTypes.array.isRequired,
  metaCovariateErrors: PropTypes.array,
  metaCovariateMapping: PropTypes.arrayOf(PropTypes.number).isRequired,
  onMapCovariate: PropTypes.func.isRequired,
};

