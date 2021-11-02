import {
  Box, Button, TextField,
} from '@material-ui/core';
import axios from 'axios';
import { remote } from 'electron';
import React, { useState } from 'react';
import { API_TOKEN_KEY } from '../state/ducks/auth';

const { app } = window.require('electron').remote;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null, bugReportOpen: false };
  }

  toggleBugReport = () => {
    this.setState({ bugReportOpen: !this.state.bugReportOpen });
  };

  closeApplication = () => {
    app.quit();
  };

  relaunchApplication = () => {
    app.relaunch();
    app.quit();
  };

  componentDidCatch(error, errorInfo) {
    // Catch errors in any components below and re-render with error message
    this.setState({
      error,
      errorInfo,
    });
    // You can also log error messages to an error reporting service here
  }

  render() {
    if (this.state.errorInfo) {
      return (
        <Box style={{
          backgroundColor: 'white', padding: '10px', height: '90vh', overflowY: 'hidden',
        }}
        >
          <h2>Something went wrong.</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo.componentStack}
          </details>
          <Button variant="contained" onClick={this.toggleBugReport}>
            Create Bug Report
          </Button>
          <Button variant="contained" onClick={this.relaunchApplication}>
            restart
          </Button>
          <Button variant="contained" onClick={this.closeApplication}>
            exit
          </Button>
          {this.state.bugReportOpen && (
            <BugReport
              error={this.state.error}
              errorInfo={this.state.errorInfo}
            />
          )}
        </Box>
      );
    }
    // Normally, just render children
    return this.props.children;
  }
}

export default ErrorBoundary;

const BugReportDefaultText = `
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Desktop (please complete the following information):**
 - OS: [e.g. Windows 10, OSX 11.15]
 - Version [eg 5.0.1] - in the very top menu got to Coinstac -> about

**Additional context**
Add any other context about the problem here.
`;

function BugReport(props) {
  const [bugText, setBugtext] = useState(BugReportDefaultText);
  const { error, errorInfo } = props;

  const getAuthToken = () => {
    // get the authentication token from local storage if it exists
    let token = localStorage.getItem(API_TOKEN_KEY);

    if (!token || token === 'null' || token === 'undefined') {
      token = sessionStorage.getItem(API_TOKEN_KEY);
    }

    return JSON.parse(token);
  };

  const handleSubmit = () => {
    const apiServer = remote.getGlobal('config').get('apiServer');
    const API_URL = `${apiServer.protocol}//${apiServer.hostname}${
      apiServer.port ? `:${apiServer.port}` : ''
    }${apiServer.pathname ? `${apiServer.pathname}` : '/graphql'}`;
    const authToken = getAuthToken();
    axios({
      url: API_URL,
      method: 'post',
      data: {
        operationName: 'createIssue',
        variables: {
          issue: {
            title: error.toString(),
            body: `${bugText} \n ${error}  \n ${errorInfo.componentStack}`,
          },
        },
        query:
          'mutation createIssue($issue: IssueInput!) {createIssue(issue: $issue)}',
      },
      headers: { Authorization: `Bearer ${authToken.token}` },
    }).then((result) => {
      console.log(result);
      alert(JSON.stringify(result.data));
    });
  };

  return (
    <Box
      component="form"
      noValidate
      autoComplete="off"
      style={{ marginTop: '10px' }}
    >
      <TextField
        id="outlined-multiline-static"
        label="Bug Text"
        variant="outlined"
        multiline
        fullWidth
        rows={10}
        value={bugText}
        onChange={(e) => {
          setBugtext(e.target.value);
        }}
      />
      <Button variant="contained" onClick={handleSubmit}>
        Submit Bug Report
      </Button>
    </Box>
  );
}
