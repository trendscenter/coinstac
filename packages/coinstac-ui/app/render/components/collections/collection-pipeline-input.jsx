import React, { Component } from 'react';
import PropTypes from 'prop-types';
import update from 'immutability-helper';

class CollectionPipelineInput extends Component {
  static getUserPropKey(val) {
    if (val.name) return val.name;
    if (val.fromCache) return val.fromCache.variable;
    if (val.type) return val.type;
  }

  constructor(props) {
    super(props);

    const consIndex = props.associatedConsortia
      .findIndex(cons => cons.id === props.consortiumId);

    if (props.objKey === 'covariates' || props.objKey === 'data') {
      const sources = Array(props.objValue.ownerMappings.length)
          .fill({
            groupId: '',
            column: '',
            fileIndex: -1,
          });

      // Populate state with existing mappings if they exist
      if (consIndex > -1 && // Is an associated consortia
          props.associatedConsortia[consIndex].stepIO[props.stepIndex] &&
          props.associatedConsortia[consIndex].stepIO[props.stepIndex][props.objKey]) {
        props.associatedConsortia[consIndex]
          .stepIO[props.stepIndex][props.objKey].forEach((step, sIndex) => {
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
    const { objKey, stepIndex, updateConsortiumClientProps } = this.props;
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
          updateConsortiumClientProps(stepIndex, objKey, covarIndex, this.state.sources);
        }
      );
    };
  }

  setSourceFile(covarIndex) {
    const { collection, objKey, objValue, stepIndex, updateConsortiumClientProps } = this.props;
    // Closure to get event and index var
    return ({ target: { value } }) => {
      this.setState(prevState =>
        ({
          sources: update(prevState.sources, {
            $splice: [[covarIndex, 1, {
              collectionId: collection.id,
              groupId: value,
              column: '',
            }]],
          }),
        }),
        () => {
          // Automap if columns exist matching preset names
          if (collection.fileGroups[value].metaFile &&
              collection
              .fileGroups[value]
              .metaFile[0].indexOf(objValue.ownerMappings[covarIndex].name) > -1) {
            this.setState(prevState =>
              ({
                sources: update(prevState.sources, {
                  $splice: [[covarIndex, 1, {
                    ...prevState.sources[covarIndex],
                    column: objValue.ownerMappings[covarIndex].name,
                  }]],
                }),
              }),
              () => {
                updateConsortiumClientProps(stepIndex, objKey, covarIndex, this.state.sources);
              }
            );
          } else {
            updateConsortiumClientProps(stepIndex, objKey, covarIndex, this.state.sources);
          }
        }
      );
    };
  }

  render() {
    const { collection, objKey, objValue, pipelineSteps } = this.props;

    return (
      <div>
        <span className="bold">{objKey}: </span>
        {'ownerMappings' in objValue &&
          <ul>
            {objValue.ownerMappings.map((val, covarIndex) => (
              <li key={this.constructor.getUserPropKey(val)} style={{ marginBottom: 5 }}>
                {objKey === 'covariates' && 'name' in val &&
                  (<span><em>Name: </em>{val.name}<br /></span>)
                }
                {objKey === 'covariates' && 'fromCache' in val &&
                  (
                    <span>
                      <em>Name: </em>
                      {pipelineSteps[val.fromCache.step].computations[0]
                        .computation.output[val.fromCache.variable].label}
                      <br />
                    </span>
                  )
                }
                <em>Type: </em>
                {'type' in val && val.type}
                {'fromCache' in val &&
                    pipelineSteps[val.fromCache.step].computations[0]
                        .computation.output[val.fromCache.variable].type
                }
                <br />
                {val.source === 'file' || val.type === 'FreeSurfer' ?
                    (
                      <span>
                        <em>Source Group: </em>
                        <select
                          value={this.state.sources[covarIndex].groupId}
                          required
                          onChange={this.setSourceFile(covarIndex)}
                        >
                          <option disabled value="" key="file-select-none">Select a File</option>
                          {Object.values(collection.fileGroups).map(group =>
                            (
                              <option
                                key={`${new Date(group.date).toUTCString()} (${group.extension})`}
                                value={group.id}
                              >
                                {`${new Date(group.date).toUTCString()} (${group.extension})`}
                              </option>
                            )
                          )}
                        </select><br />
                      </span>
                    )
                  : (
                    <span>
                      <em>Source: </em>{`Step ${val.fromCache.step + 1} Output`}
                    </span>
                  )
                }
                {this.state.sources[covarIndex].groupId
                  && this.state.sources[covarIndex].groupId.length > 0 &&
                  collection.fileGroups[
                    this.state.sources[covarIndex].groupId
                  ].metaFile &&
                    <span>
                      <em>File Column: </em>
                      <select
                        value={this.state.sources[covarIndex].column}
                        required
                        onChange={this.setSourceColumn(covarIndex)}
                      >
                        <option disabled value="">Select a Column</option>
                        {collection.fileGroups[
                          this.state.sources[covarIndex].groupId
                        ].metaFile[0].map(col =>
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
        {'value' in objValue && Array.isArray(objValue) &&
          <span>{objValue.value.join(', ')}</span>
        }
        {(typeof objValue.value === 'number' || typeof objValue.value === 'string') &&
          <span>{objValue.value}</span>
        }
      </div>
    );
  }
}

CollectionPipelineInput.propTypes = {
  associatedConsortia: PropTypes.array.isRequired,
  collection: PropTypes.object.isRequired,
  consortiumId: PropTypes.string.isRequired,
  objKey: PropTypes.string.isRequired,
  objValue: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.object,
    PropTypes.array,
  ]).isRequired,
  pipelineSteps: PropTypes.array.isRequired,
  stepIndex: PropTypes.number.isRequired,
  updateConsortiumClientProps: PropTypes.func.isRequired,
};

export default CollectionPipelineInput;
