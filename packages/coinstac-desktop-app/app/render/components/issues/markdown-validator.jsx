import grey from '@material-ui/core/colors/grey';
import red from '@material-ui/core/colors/red';
import React from 'react';
import { ValidatorComponent } from 'react-material-ui-form-validator';
import ReactMde from 'react-mde';
import * as Showdown from 'showdown';

const converter = new Showdown.Converter({
  tables: true,
  simplifiedAutoLink: true,
  strikethrough: true,
  tasklists: true,
});

const style = {
  fontSize: 12,
  color: red['500'],
  marginTop: 8,
};

class MarkdownValidator extends ValidatorComponent {
  constructor(props) {
    super(props);

    this.state = {
      selectedTab: 'write',
      isValid: true,
    };
  }

  handleTabChange = (selectedTab) => {
    this.setState({ selectedTab });
  }

  errorText() {
    const { isValid } = this.state;

    if (isValid) {
      return null;
    }

    return (
      <div style={style}>
        {this.state.errorMessages[0]}
      </div>
    );
  }

  renderValidatorComponent() {
    const {
      className, label, errorMessages, validators, requiredError, withRequiredValidator,
      value, ...rest
    } = this.props;
    const { selectedTab, isValid } = this.state;

    const labelStyle = {
      color: isValid ? grey['600'] : red['500'],
      marginTop: 24,
      marginBottom: 4,
      fontSize: 16,
    };

    return (
      <div className={className}>
        <div style={labelStyle}>
          {label}
          {withRequiredValidator && ' *'}
        </div>

        <ReactMde
          {...rest}
          initialEditorHeight={500}
          value={value}
          selectedTab={selectedTab}
          withRequiredValidator={withRequiredValidator}
          onTabChange={this.handleTabChange}
          ref={(r) => { this.input = r; }}
          generateMarkdownPreview={markdown => Promise.resolve(converter.makeHtml(markdown))}
        />
        {this.errorText()}
      </div>
    );
  }
}

export default MarkdownValidator;
