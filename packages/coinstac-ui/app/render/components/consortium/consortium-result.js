import React, { PropTypes } from 'react';
import { Collapse, Label } from 'react-bootstrap';
import classNames from 'classnames';
import moment from 'moment';
import { reduce } from 'lodash';

import ConsortiumResultMeta from './consortium-result-meta';
import ConsortiumResultTable from './consortium-result-table';

export default function ConsortiumResult({
  computationInputs,
  complete,
  computation,
  data,
  endDate,
  expanded,
  pluginState,
  startDate,
  toggleCollapse,
  userErrors,
  usernames,
}) {
  let computationOutput;
  let dataOutput;
  let errors;
  let heading;
  let indicator;

  if (userErrors.length) {
    indicator = <Label bsStyle="danger">Error!</Label>;
  } else if (complete) {
    indicator = <Label bsStyle="success">Complete!</Label>;
  } else {
    indicator = <Label bsStyle="default">In Progress</Label>;
  }

  if (userErrors.length) {
    errors = (
      <div>
        <h3 className="h4">User errors:</h3>
        {userErrors.map((error, i) => {
          return <p key={i} className="bg-danger">{error}</p>;
        })}
      </div>
    );
  }

  if (computation) {
    computationOutput = (
      <ConsortiumResultMeta
        computation={computation}
        computationInputs={computationInputs}
        step={pluginState['group-step'].step}
        usernames={usernames}
      />
    );
  }

  if (data) {
    /**
     * @todo This assumes covariates are placed at a specific location in
     * `computationInputs`. Don't hard-code this!
     */
    const covariates =
      computation.name === 'decentralized-single-shot-ridge-regression' ?
      computationInputs[0][2].map(x => x.name) :
      computationInputs[0][3].map(x => x.name);

    dataOutput = (
      <div>
        {reduce(data, (memo, item, prop) => {
          /**
           * Computations store users' data in numeric properties and global
           * data under the `global` property.
           */
          if (prop === 'global') {
            return [
              <ConsortiumResultTable
                betaVector={item.betaVector}
                covariates={covariates}
                key={prop}
                name={'Global'}
                pValue={item.pValue}
                rSquared={item.rSquared}
                tValue={item.tValue}
              />,
              ...memo,
            ];
          } else if (Number(prop) == prop) { // eslint-disable-line eqeqeq
            return [
              ...memo,
              <ConsortiumResultTable
                betaVector={item.betaVector}
                covariates={covariates}
                key={prop}
                name={usernames[prop]}
                pValue={item.pValueOriginal}
                rSquared={item.rSquaredOriginal}
                tValue={item.tValueOriginal}
              />,
            ];
          }

          return memo;
        }, [])}
      </div>
    );
  }

  if (endDate) {
    heading = `Ended ${moment(endDate).fromNow()}`;
  } else {
    heading = `Started ${moment(startDate).fromNow()}`;
  }

  return (
    <div className="consortium-result panel panel-default">
      <div className="panel-heading">
        <h3 className="panel-title h4">
          <a
            onClick={toggleCollapse}
            role="button"
          >
            {heading}
            {' '}
            {indicator}
            <span
              aria-hidden="true"
              className={classNames('glyphicon glyphicon-chevron-down', {
                open: expanded,
              })}
            >
            </span>
          </a>
        </h3>
      </div>
      <Collapse in={expanded}>
        <div className="panel-body">
          {computationOutput}
          {errors}
          {dataOutput}
        </div>
      </Collapse>
    </div>
  );
}

ConsortiumResult.displayName = 'ConsortiumResult';

ConsortiumResult.propTypes = {

  complete: PropTypes.bool.isRequired,
  computation: PropTypes.shape({
    meta: PropTypes.shape({
      name: PropTypes.string.isRequired,
    }),
    version: PropTypes.string.isRequired,
  }).isRequired,
  computationInputs: PropTypes.arrayOf(PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.string),
      PropTypes.arrayOf(PropTypes.object),
      PropTypes.number,
    ])
  )).isRequired,
  data: PropTypes.shape({
    global: PropTypes.shape({
      betaVector: PropTypes.arrayOf(PropTypes.number).isRequired,
      pValue: PropTypes.arrayOf(PropTypes.number).isRequired,
      rSquared: PropTypes.number.isRequired,
      tValue: PropTypes.arrayOf(PropTypes.number).isRequired,
    }).isRequired,
  }),
  endDate: PropTypes.number,
  expanded: PropTypes.bool.isRequired,
  pipelineState: PropTypes.object.isRequired,
  pluginState: PropTypes.object.isRequired,
  startDate: PropTypes.number.isRequired,
  toggleCollapse: PropTypes.func.isRequired,
  usernames: PropTypes.array.isRequired,
  userErrors: PropTypes.array.isRequired,
};
