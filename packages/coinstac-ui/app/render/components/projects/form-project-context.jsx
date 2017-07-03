import {
  ControlLabel,
  FormControl,
  FormGroup,
  HelpBlock,
} from 'react-bootstrap';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class FormProjectContext extends Component {
  renderAnalysisSelector() {
    const { analysis, analysisLabel, consortia, consortium } = this.props;
    const label = analysisLabel || 'Analysis:';
    let consortiumModel;
    let helpBlock;
    let options;
    let validationState;

    // Exit early if there's no consortium
    if (consortium.value) {
      return;
    }

    if (analysis && analysis.error) {
      helpBlock = <HelpBlock>{analysis.error}</HelpBlock>;
      validationState = 'error';
    }

    // @TODO first thing.
    // `.value` isn't always a thing.  do i need to do
    // `consortium.value/intialValue/defaultValue`?
    if (consortia.find(c => c._id === consortium.value)) {
      options = consortiumModel.analyses.map((a) => {
        return <option key={a.id} value={a.id}>{a.label}</option>;
      });
    }

    return (
      <FormGroup
        controlId="project-context-analysis"
        validationState={validationState}
      >
        <ControlLabel>{label}</ControlLabel>
        <FormControl
          componentClass="select"
          ref={(c) => { this.analysisForm = c; }}
          {...analysis}
        >
          <option key="0" value="">Choose analysis…</option>
          {options}
        </FormControl>
        {helpBlock}
      </FormGroup>
    );
  }

  renderConsortiaSelector() {
    const { consortia, consortium, consortiumLabel } = this.props;
    const label = consortiumLabel || 'Consortia:';
    let helpBlock;
    let validationState;

    if (consortium && consortium.error) {
      helpBlock = <HelpBlock>{consortium.error}</HelpBlock>;
      validationState = 'error';
    }

    return (
      <FormGroup
        controlId="project-context-consortium"
        validationState={validationState}
      >
        <ControlLabel>{label}</ControlLabel>
        <FormControl
          componentClass="select"
          ref={(c) => { this.consortiumForm = c; }}
          {...consortium}
        >
          <option key="0" value="">Choose consortium…</option>
          {consortia.map((tium) => {
            const hasAnalyses = tium.analyses && tium.analyses.length;
            const optionText = tium.label + (hasAnalyses ? '' : ' (no analyses available)');
            return (
              <option
                key={tium._id}
                value={tium._id}
                disabled={!hasAnalyses}
                title={!hasAnalyses ? 'Please add analyses to consortium' : ''}
              >
                {optionText}
              </option>
            );
          })}
        </FormControl>
        {helpBlock}
      </FormGroup>
    );
  }

  render() {
    return (
      <div>
        {this.renderConsortiumSelector()}
        {this.renderAnalysisSelector()}
      </div>
    );
  }
}

FormProjectContext.propTypes = {
  analysis: PropTypes.object.isRequired,
  analysisLabel: PropTypes.string,
  consortia: PropTypes.array.isRequired,
  consortium: PropTypes.object,
  consortiumLabel: PropTypes.string,
};
