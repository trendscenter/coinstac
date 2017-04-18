import React, { Component } from 'react';
import PropTypes from 'prop-types';
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
    const options = [<option disabled key={0} value="null">Map column…</option>]
      .concat(covariates.map(({ name, type }, i) => {
        return (
          <option key={i + 1} value={i}>
            {`${name} (${ComputationFieldCovariates.typeMap.get(type)})`}
          </option>
        );
      }));

    const tableHeadings = [<th key={0}>{row[0]}</th>].concat(
      tail(row).map((heading, i) => {
        const index = i + 1;
        const value =
          (
            index in metaCovariateMapping &&
            typeof metaCovariateMapping[index] === 'number'
          ) ?
            metaCovariateMapping[index] :
            'null';
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
        } else if (value !== 'null') {
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
                  onMapCovariate(parseInt(event.target.value, 10), index);
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
        <p>Map your metadata file’s columns to the required computation input fields:</p>
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
  metaCovariateMapping: PropTypes.object.isRequired,
  onMapCovariate: PropTypes.func.isRequired,
};
