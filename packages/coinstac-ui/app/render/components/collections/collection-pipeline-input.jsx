import React from 'react';
import { graphql } from 'react-apollo';
import PropTypes from 'prop-types';
import {
  ControlLabel,
  FormGroup,
  FormControl,
} from 'react-bootstrap';
import { FETCH_PIPELINE_QUERY } from '../../state/graphql/functions';

const CollectionPipelineInput = ({ collectionFiles, objKey, objValue }) => (
  <div>
    <span className="bold">{objKey}: </span>
    {objKey === 'covariates' &&
      <ul>
        {objValue.map(val => (
          <li key={val.name} style={{ marginBottom: 5 }}>
            <em>Name: </em>{val.name}<br />
            <em>Type: </em>{val.type}<br />
            
            {val.source.inputKey === 'file' ?
                (
                  <span>
                    <em>Source File: </em>
                    <select defaultValue="" required>
                      <option disabled value="">Select a File</option>
                      {collectionFiles.map(file =>
                        (
                          <option
                            key={file.metaFilePath}
                            value={file.metaFilePath}
                          >
                            {file.metaFilePath}
                          </option>
                        )
                      )}
                    </select>
                  </span>
                )
              : (<span><em>Source: </em> {val.source.inputLabel}</span>) }
          </li>
        ))}
      </ul>
    }
    {Array.isArray(objValue) && objKey !== 'covariates' &&
      <span>{objValue.join(', ')}</span>
    }
    {(typeof objValue === 'number' || typeof objValue === 'string') &&
      <span>{objValue}</span>
    }
  </div>
);

CollectionPipelineInput.propTypes = {
  collectionFiles: PropTypes.array,
  objKey: PropTypes.string.isRequired,
  objValue: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.object,
    PropTypes.array,
  ]).isRequired,
};

CollectionPipelineInput.defaultProps = {
  collectionFiles: [],
};

export default CollectionPipelineInput;
