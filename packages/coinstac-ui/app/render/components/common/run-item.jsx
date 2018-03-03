import React from 'react';
import TimeStamp from 'react-timestamp';
import { Button, Col, Panel, ProgressBar, Row, Well } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import PropTypes from 'prop-types';

const RunItem = ({ consortiumName, runObject }) => (
  <Panel
    key={runObject.id}
    header={
      <h3>
        {consortiumName}
        {runObject.pipelineSnapshot && (<span> || {runObject.pipelineSnapshot.name}</span>)}
        {!runObject.endDate &&
          <div className="pull-right">{'Started: '}
            <TimeStamp
              time={runObject.startDate / 1000}
              precision={2}
              autoUpdate={10}
              format="ago"
            />
          </div>
        }
        {runObject.endDate &&
          <div className="pull-right">{'Completed: '}
            <TimeStamp
              time={runObject.endDate / 1000}
              precision={2}
              autoUpdate={10}
              format="ago"
            />
          </div>
        }
      </h3>
    }
  >
    {runObject.status === 'started' && (runObject.localPipelineState || runObject.remotePipelineState) &&
      <Row>
        <Col xs={12}>
          <ProgressBar
            active
            now={runObject.remotePipelineState
              ? ((runObject.remotePipelineState.pipelineStep + 1) /
              runObject.remotePipelineState.totalSteps) * 100
              : ((runObject.localPipelineState.pipelineStep + 1) /
              runObject.localPipelineState.totalSteps) * 100
            }
          />
        </Col>
      </Row>
    }
    <Row>
      <Col xs={12} sm={4}>
        <div>
          <span className="bold">Status: </span>
          {runObject.status === 'complete' && <span style={{ color: 'green' }}>Complete</span>}
          {runObject.status === 'started' && <span style={{ color: 'orange' }}>In Progress</span>}
          {runObject.status === 'needs-map' &&
            <div>
              <span style={{ color: 'red' }}>Missing Data Mappings</span>
              <LinkContainer
                to={'dashboard/collections'}
              >
                <Button bsStyle="warning">Map Now</Button>
              </LinkContainer>
            </div>
          }
        </div>
        {runObject.startDate &&
          <div>
            <span className="bold">Start date: </span>
            <TimeStamp
              time={runObject.startDate / 1000}
              precision={2}
              autoUpdate={10}
              format="full"
            />
          </div>
        }
        {runObject.endDate &&
          <div>
            <span className="bold">End date: </span>
            <TimeStamp
              time={runObject.endDate / 1000}
              precision={2}
              autoUpdate={10}
              format="full"
            />
          </div>
        }
        {runObject.clients &&
          <p>
            <span className="bold">Clients: </span>
            {runObject.clients.join(', ')}
          </p>
        }
      </Col>
      {runObject.localPipelineState && runObject.status === 'started' &&
        <Col xs={12} sm={4}>
          <Well bsSize="small">
            <div style={{ marginBottom: 5 }}>
              <span className="bold" style={{ textDecoration: 'underline' }}>Local Pipeline State: </span>
            </div>
            {runObject.localPipelineState.mode &&
              <div>
                <span className="bold">Mode: </span>
                {runObject.localPipelineState.mode}
              </div>
            }
            {runObject.localPipelineState.controllerState &&
              <div>
                <span className="bold">Controller State: </span>
                {runObject.localPipelineState.controllerState}
              </div>
            }
            {runObject.localPipelineState.currentIteration >= 0 &&
              <div>
                <span className="bold">Current Iteration: </span>
                {runObject.localPipelineState.currentIteration}
              </div>
            }
            {runObject.localPipelineState.pipelineStep >= 0 &&
              <div>
                <span className="bold">Step Count: </span>
                {`${runObject.localPipelineState.pipelineStep + 1} /
                  ${runObject.localPipelineState.totalSteps}`}
              </div>
            }
          </Well>
        </Col>
      }
      {runObject.remotePipelineState && runObject.status === 'started' &&
        <Col xs={12} sm={4}>
          <Well bsSize="small">
            <div style={{ marginBottom: 5 }}>
              <span className="bold" style={{ textDecoration: 'underline' }}>Remote Pipeline State: </span>
            </div>
            {runObject.remotePipelineState.mode &&
              <div>
                <span className="bold">Mode: </span>
                {runObject.remotePipelineState.mode}
              </div>
            }
            {runObject.remotePipelineState.controllerState &&
              <div>
                <span className="bold">Controller State: </span>
                {runObject.remotePipelineState.controllerState}
              </div>
            }
            {runObject.remotePipelineState.currentIteration >= 0 &&
              <div>
                <span className="bold">Current Iteration: </span>
                {runObject.remotePipelineState.currentIteration}
              </div>
            }
            {runObject.remotePipelineState.pipelineStep >= 0 &&
              <div>
                <span className="bold">Step Count: </span>
                {`${runObject.remotePipelineState.pipelineStep + 1} /
                  ${runObject.remotePipelineState.totalSteps}`}
              </div>
            }
          </Well>
        </Col>
      }
    </Row>
    <Row>
      <Col xs={12}>
        {runObject.results &&
          <LinkContainer
            to={`dashboard/results/${runObject.id}`}
          >
            <Button bsStyle="success">View Results</Button>
          </LinkContainer>
        }
        {runObject.pipelineSnapshot &&
          <LinkContainer
            className="pull-right"
            to={`dashboard/pipelines/snapShot/${runObject.pipelineSnapshot.id}`}
          >
            <Button bsStyle="info">View Pipeline</Button>
          </LinkContainer>
        }
      </Col>
    </Row>
  </Panel>
);

RunItem.propTypes = {
  consortiumName: PropTypes.string.isRequired,
  runObject: PropTypes.object.isRequired,
};

export default RunItem;
