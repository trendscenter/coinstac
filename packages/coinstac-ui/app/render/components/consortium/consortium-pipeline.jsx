import React, { Component } from 'react';
import { Button, Col, DropdownButton, MenuItem, Row, Well } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

const styles = {
  activePipelineButton: { margin: '0 5px 0 0' },
  activePipelineParagraph: { borderBottom: '1px solid black' },
  textCenter: { textAlign: 'center' },
};

class ConsortiumPipeline extends Component{
  constructor(props) {
    super(props);
  }
  render(){
    let { consortium } = this.props;
    return(
      <div>
      <h3>Active Pipeline</h3>
      <Well><em>No active pipeline</em></Well>
      <div className="clearfix">
        <div className="pull-right">
          <Button
            bsStyle="info"
            style={styles.activePipelineButton}
          >
            Edit
          </Button>
          <Button
            bsStyle="success"
            style={styles.activePipelineButton}
          >
            Save
          </Button>
        </div>
      </div>
      <h4 style={styles.activePipelineParagraph}>Activate a pipeline from...</h4>
      <Row>
        <Col xs={6} style={styles.textCenter}>
          <DropdownButton id="your-pipelines-dropdown" title={'Your Pipelines'} bsStyle="primary">
            <MenuItem>Stuff</MenuItem>
            <MenuItem>Things</MenuItem>
          </DropdownButton>
        </Col>
        <Col xs={6} style={styles.textCenter}>
          <DropdownButton id="shared-pipelines-dropdown" title={'Shared Pipelines'} bsStyle="primary">
            <MenuItem>Stuff</MenuItem>
            <MenuItem>Things</MenuItem>
          </DropdownButton>
        </Col>
      </Row>
      <Row style={{ marginTop: 50 }}>
        <Col xs={12} style={styles.textCenter}>
          <p><em>Or create a new pipeline</em></p>
          <LinkContainer to={`/dashboard/pipelines/new/${consortium.id}`}>
            <Button bsStyle="success">
              <span aria-hidden="true" className="glphicon glyphicon-plus" />
              {' '}
              New Pipeline
            </Button>
          </LinkContainer>
        </Col>
      </Row>
    </div>
    );
  }
}

export default ConsortiumPipeline;
