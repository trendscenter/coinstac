import React, { Component } from 'react';
import PropTypes from 'prop-types';
import update from 'immutability-helper';

class CollectionPipelineInput extends Component {
  constructor(props) {
    super(props);

    const consIndex = props.collection.associatedConsortia
      .findIndex(cons => cons.id === props.consortiumId);

    if (props.objKey === 'covariates') {
      const sources = Array(props.objValue.length)
          .fill({
            filePath: '',
            column: '',
            fileIndex: -1,
          });

      // Populate state with existing mappings if they exist
      if (consIndex > -1 && // Is an associated consortia
          props.collection.associatedConsortia[consIndex].stepIO[props.stepIndex] &&
          props.collection.associatedConsortia[consIndex].stepIO[props.stepIndex].length) {
        props.collection.associatedConsortia[consIndex]
          .stepIO[props.stepIndex].forEach((step, sIndex) => {
            sources[sIndex] = { ...step };
          });
      }

      this.state = {
        sources,
      };
    }

    this.setSourceColumn = this.setSourceColumn.bind(this);
    this.setSourceFile = this.setSourceFile.bind(this);
  }

  setSourceColumn(covarIndex) {
    const { stepIndex, updateConsortiumCovars } = this.props;
    return ({ target: { value } }) => {
      this.setState(prevState =>
        ({
          sources: update(prevState.sources, {
            $splice: [[covarIndex, 1, {
              ...prevState.sources[covarIndex],
              column: value,
            }]],
          }),
        }),
        () => {
          updateConsortiumCovars(stepIndex, covarIndex, this.state.sources);
        }
      );
    };
  }

  setSourceFile(covarIndex) {
    const { collection, objValue, stepIndex, updateConsortiumCovars } = this.props;
    // Closure to get event and index var
    return ({ target: { value } }) => {
      const fileIndex = collection.files.findIndex(file => file.metaFilePath === value);
      this.setState(prevState =>
        ({
          sources: update(prevState.sources, {
            $splice: [[covarIndex, 1, {
              filePath: value,
              fileIndex,
              column: '',
            }]],
          }),
        }),
        () => {
          // Automap if columns exist matching preset names
          if (collection
              .files[fileIndex]
              .metaFile[0].indexOf(objValue[covarIndex].name) > -1) {
            this.setState(prevState =>
              ({
                sources: update(prevState.sources, {
                  $splice: [[covarIndex, 1, {
                    ...prevState.sources[covarIndex],
                    column: objValue[covarIndex].name,
                  }]],
                }),
              })
            );
            updateConsortiumCovars(stepIndex, covarIndex, this.state.sources);
          }
        }
      );
    };
  }

  render() {
    const { collection, objKey, objValue } = this.props;

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
                          {collection.files.map(file =>
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
                      {collection.files[parseInt(this.state.sources[covarIndex].fileIndex, 10)]
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
  collection: PropTypes.object.isRequired,
  consortiumId: PropTypes.string.isRequired,
  objKey: PropTypes.string.isRequired,
  objValue: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.object,
    PropTypes.array,
  ]).isRequired,
  stepIndex: PropTypes.number.isRequired,
  updateConsortiumCovars: PropTypes.func.isRequired,
};

export default CollectionPipelineInput;
