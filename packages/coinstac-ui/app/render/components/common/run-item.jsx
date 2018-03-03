import React from 'react';
import TimeStamp from 'react-timestamp';
import { Button, Col, Panel, ProgressBar, Row, Well } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import PropTypes from 'prop-types';

function getStateWell(runObject, stateName, stateKey) {
  return (
    <Col xs={12} sm={4}>
      <Well bsSize="small">
        <div style={{ marginBottom: 5 }}>
          <span className="bold" style={{ textDecoration: 'underline' }}>{stateName} Pipeline State: </span>
        </div>
        {runObject[stateKey].mode &&
          <div>
            <span className="bold">Mode: </span>
            {runObject[stateKey].mode}
          </div>
        }
        {runObject[stateKey].controllerState &&
          <div>
            <span className="bold">Controller State: </span>
            {runObject[stateKey].controllerState}
          </div>
        }
        {runObject[stateKey].currentIteration >= 0 &&
          <div>
            <span className="bold">Current Iteration: </span>
            {runObject[stateKey].currentIteration}
          </div>
        }
        {runObject[stateKey].pipelineStep >= 0 &&
          <div>
            <span className="bold">Step Count: </span>
            {`${runObject[stateKey].pipelineStep + 1} /
              ${runObject[stateKey].totalSteps}`}
          </div>
        }
      </Well>
    </Col>
  );
}

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
        getStateWell(runObject, 'Local', 'localPipelineState')
      }
      {runObject.remotePipelineState && runObject.status === 'started' &&
        getStateWell(runObject, 'Remote', 'remotePipelineState')
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
