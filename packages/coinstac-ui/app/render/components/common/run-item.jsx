import React from 'react';
import TimeStamp from 'react-timestamp';
import { Button, Panel, ProgressBar } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import PropTypes from 'prop-types';

const ResultItem = ({ consortiumName, runObject }) => (
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
    <div>
      {runObject.status === 'started' && <ProgressBar active now={100} />}
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
  </Panel>
);

ResultItem.propTypes = {
  consortiumName: PropTypes.string.isRequired,
  runObject: PropTypes.object.isRequired,
};

export default ResultItem;
