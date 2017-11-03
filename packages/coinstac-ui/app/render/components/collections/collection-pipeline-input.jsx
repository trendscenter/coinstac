import React, { Component } from 'react';
import PropTypes from 'prop-types';
import update from 'immutability-helper';
import { saveCollection } from '../../state/ducks/collections';

class CollectionPipelineInput extends Component {
  constructor(props) {
    super(props);

    if (props.objKey === 'covariates') {
      this.state = {
        sources: Array(props.objValue.length)
          .fill({
            filePath: '',
            column: '',
            fileIndex: -1,
          }),
      };
    }

    this.setSourceColumn = this.setSourceColumn.bind(this);
    this.setSourceFile = this.setSourceFile.bind(this);
  }

  setSourceColumn(covarIndex) {
    const { updateConsortiumCovars } = this.props;
    return ({ target: { value } }) => {
      this.setState(prevState =>
        ({
          sources: update(prevState.sources, {
            $splice: [[covarIndex, 1, {
              ...prevState.sources[covarIndex],
              column: value,
            }]],
          }),
        }), () => {
          // updateConsortiumCovars(...);
      });
    };
  }

  setSourceFile(covarIndex) {
    // Closure to get event and index var
    return ({ target: { value } }) => {
      const fileIndex = this.props.collectionFiles.findIndex(file => file.metaFilePath === value);
      this.setState(prevState =>
        ({
          sources: update(prevState.sources, {
            $splice: [[covarIndex, 1, {
              filePath: value,
              fileIndex,
              column: '',
            }]],
          }),
        })
      );
    };
  }

  render() {
    const { collectionFiles, objKey, objValue } = this.props;

    return (
      <div>
        <span className="bold">{objKey}: </span>
        {objKey === 'covariates' &&
          <ul>
            {objValue.map((val, covarIndex) => (
              <li key={val.name} style={{ marginBottom: 5 }}>
                <em>Name: </em>{val.name}<br />
                <em>Type: </em>{val.type}<br />
                {val.source.inputKey === 'file' ?
                    (
                      <span>
                        <em>Source File: </em>
                        <select
                          value={this.state.sources[covarIndex].filePath}
                          required
                          onChange={this.setSourceFile(covarIndex)}
                        >
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
                        </select><br />
                      </span>
                    )
                  : (<span><em>Source: </em> {val.source.inputLabel}</span>)
                }
                {this.state.sources[covarIndex].filePath.length > 0 &&
                  <span>
                    <em>File Column: </em>
                    <select
                      value={this.state.sources[covarIndex].column}
                      required
                      onChange={this.setSourceColumn(covarIndex)}
                    >
                      <option disabled value="">Select a Column</option>
                      {collectionFiles[parseInt(this.state.sources[covarIndex].fileIndex, 10)]
                        .metaFile[0].map(col =>
                        (
                          <option
                            key={col}
                            value={col}
                          >
                            {col}
                          </option>
                        )
                      )}
                    </select>
                  </span>
                }
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
  }
}

CollectionPipelineInput.propTypes = {
  collectionFiles: PropTypes.array,
  objKey: PropTypes.string.isRequired,
  objValue: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.object,
    PropTypes.array,
  ]).isRequired,
  updateConsortiumCovars: PropTypes.func.isRequired,
};

CollectionPipelineInput.defaultProps = {
  collectionFiles: [],
};

export default CollectionPipelineInput;
