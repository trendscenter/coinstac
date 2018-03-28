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

  componentWillReceiveProps(nextProps) {
    const cons = nextProps.associatedConsortia
      .find(cons => cons.id === this.props.consortiumId);

    if (cons && cons.stepIO.length === 0
      && (nextProps.objKey === 'covariates' || nextProps.objKey === 'data')
    ) {
      this.setState({
        sources: Array(nextProps.objValue.ownerMappings.length)
          .fill({
            groupId: '',
            column: '',
            fileIndex: -1,
          }),
      });
    }
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
          let colIndex = -1;
          // Automap if columns exist matching preset names
          if (collection.fileGroups[value].metaFile) {
            colIndex = collection
              .fileGroups[value]
              .metaFile[0].findIndex(col =>
                col.toLowerCase().includes(
                  objValue.ownerMappings[covarIndex].name
                  ? objValue.ownerMappings[covarIndex].name.toLowerCase()
                  : objValue.ownerMappings[covarIndex].type.toLowerCase()
                )
              );

            if (colIndex > -1) {
              this.setState(prevState =>
                ({
                  sources: update(prevState.sources, {
                    $splice: [[covarIndex, 1, {
                      ...prevState.sources[covarIndex],
                      column: collection.fileGroups[value].metaFile[0][colIndex],
                    }]],
                  }),
                }),
                () => {
                  updateConsortiumClientProps(stepIndex, objKey, covarIndex, this.state.sources);
                }
              );
            }
          }

          // Failed above conditions
          if (colIndex === -1) {
            updateConsortiumClientProps(stepIndex, objKey, covarIndex, this.state.sources);
          }
        }
      );
    };
  }

  render() {
    const { collection, objKey, objValue, pipelineSteps, stepIndex } = this.props;

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
                          {Object.values(collection.fileGroups)
                            .filter((group) => {
                              return (
                                objKey === 'data'
                                ? pipelineSteps[stepIndex].computations[0]
                                  .computation.input.data.extensions[
                                    pipelineSteps[stepIndex].computations[0]
                                    .computation.input.data.items.indexOf(val.type)
                                  ].indexOf(group.extension.substring(1)) > -1
                                : true
                              );
                            })
                            .map(group =>
                            (
                              <option
                                key={group.name}
                                value={group.id}
                              >
                                {group.name}
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
                        ].metaFile[0]
                        .map((col, fileRowIndex) => {
                          const colVal = collection.fileGroups[
                            this.state.sources[covarIndex].groupId
                          ].metaFile[1][fileRowIndex];

                          const colValIsBool = (colVal.toLowerCase() === 'true' || colVal.toLowerCase() === 'false');
                          const colValIsNumber = !isNaN(colVal);

                          // Filter out column values of the wrong type
                          if (
                            (objValue.ownerMappings[covarIndex].type === 'boolean' && colValIsBool)
                            || (objValue.ownerMappings[covarIndex].type === 'number' && colValIsNumber)
                            || ((objValue.ownerMappings[covarIndex].type === 'string' || objKey === 'data')
                            && !colValIsBool && !colValIsNumber)) {
                            return (
                              <option
                                key={col}
                                value={col}
                              >
                                {col}
                              </option>
                            );
                          }

                          return null;
                        })}
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
