/**
 * Use React Router to implement application routing.
 *
 * @{@link  http://rackt.github.io/react-router/}
 * @{@link  https://github.com/rackt/react-router}
 */
import React from 'react';
import { Route, IndexRoute, IndexRedirect } from 'react-router';
import App from './components/app';
import ComputationsList from './components/computations/computations-list';
import ComputationSubmission from './components/computations/computation-submission';
import ConsortiaList from './components/consortia/consortia-list';
import ConsortiumTabs from './components/consortia/consortium-tabs';
import Dashboard from './components/dashboard/dashboard';
import DashboardHome from './components/dashboard/dashboard-home';
import RouteContainer from './containers/route-container';
import Login from './components/user/form-login-controller';
import Signup from './components/user/form-signup-controller';
import ForgotPassword from './components/user/form-password-controller';
import Maps from './components/maps/maps';
import MapsEdit from './components/maps/maps-edit';
import PipelinesList from './components/pipelines/pipelines-list';
import Pipeline from './components/pipelines/pipeline';
import ResultsList from './components/results/results-list';
import Result from './components/results/result';
import Settings from './components/user/settings';
import Issues from './components/issues';
import Threads from './components/threads';
import Logs from './components/logs-display/logs';
import Papaya from './components/papaya';
import Permissions from './components/permissions';
import HeadlessList from './components/headless/headless-list';
import HeadlessEdit from './components/headless/headless-edit';
import DataDiscovery from './components/data-discovery';
import EditDataset from './components/data-discovery/edit-dataset';
import pipelineStates from './components/pipeline-states';

export default (
  <Route path="/" component={App}>
    <IndexRedirect to="/login" />
    <Route path="login" component={Login} />
    <Route path="signup" component={Signup} />
    <Route path="forgot-password" component={ForgotPassword} />
    <Route path="dashboard" component={Dashboard}>
      <IndexRoute component={DashboardHome} />
      <Route path="consortia" component={RouteContainer}>
        <IndexRoute component={ConsortiaList} />
        <Route path="new" component={ConsortiumTabs} />
        <Route path=":consortiumId" component={ConsortiumTabs} />
        <Route path=":consortiumId/:tabId" component={ConsortiumTabs} />
      </Route>
      <Route path="maps" component={RouteContainer}>
        <IndexRoute component={Maps} />
        <Route path=":consortiumId" component={MapsEdit} />
      </Route>
      <Route path="pipelines" component={RouteContainer}>
        <IndexRoute component={PipelinesList} />
        <Route path="new(/:consortiumId)" component={Pipeline} />
        <Route path=":pipelineId" component={Pipeline} />
        <Route path="snapShot(/:runId)" component={Pipeline} />
      </Route>
      <Route path="results" component={RouteContainer}>
        <IndexRoute component={ResultsList} />
        <Route path=":resultId" component={Result} />
      </Route>
      <Route path="computations" component={RouteContainer}>
        <IndexRoute component={ComputationsList} />
        <Route path="new" component={ComputationSubmission} />
      </Route>
      <Route path="headlessClients" component={RouteContainer}>
        <IndexRoute component={HeadlessList} />
        <Route path="new" component={HeadlessEdit} />
        <Route path=":headlessClientId" component={HeadlessEdit} />
      </Route>
      <Route path="settings" component={Settings} />
      <Route path="issues" component={Issues} />
      <Route path="threads" component={Threads} />
      <Route path="logs" component={Logs} />
      <Route path="papaya" component={Papaya} />
      <Route path="permissions" component={Permissions} />
      <Route path="data-discovery" component={RouteContainer}>
        <IndexRoute component={DataDiscovery} />
        <Route path="new" component={EditDataset} />
        <Route path=":datasetId" component={EditDataset} />
      </Route>
      <Route path="pipeline-states" component={pipelineStates} />
    </Route>
  </Route>
);
