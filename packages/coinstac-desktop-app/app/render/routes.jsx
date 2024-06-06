/**
 * Use React Router to implement application routing.
 *
 * @{@link  http://rackt.github.io/react-router/}
 * @{@link  https://github.com/rackt/react-router}
 */
import React from 'react';
import { IndexRedirect, IndexRoute, Route } from 'react-router';

import Admin from './components/admin/admin';
import App from './components/app';
import ComputationSubmission from './components/computations/computation-submission';
import ComputationsListContainer from './components/computations/computations-list-container';
import ConsortiaList from './components/consortia/consortia-list';
import ConsortiumTabs from './components/consortia/consortium-tabs';
import Dashboard from './components/dashboard/dashboard';
import DashboardHome from './components/dashboard/dashboard-home';
import DataDiscovery from './components/data-discovery';
import EditDataset from './components/data-discovery/edit-dataset';
import HeadlessEdit from './components/headless/headless-edit';
import HeadlessList from './components/headless/headless-list';
import Issues from './components/issues';
import Logs from './components/logs-display/logs';
import Maps from './components/maps/maps';
import MapsEdit from './components/maps/maps-edit';
import Papaya from './components/papaya';
import Pipeline from './components/pipelines/pipeline';
import PipelinesList from './components/pipelines/pipelines-list';
import Result from './components/results/result';
import ResultsList from './components/results/results-list';
import Threads from './components/threads';
import ForgotPassword from './components/user/form-forgot-password-controller';
import Login from './components/user/form-login-controller';
import ResetPassword from './components/user/form-reset-password-controller';
import Signup from './components/user/form-signup-controller';
import Settings from './components/user/settings';
import RouteContainer from './containers/route-container';
// import UserAccounts from './components/admin/user-accounts';
// import Permissions from './components/admin/permissions';
// import PipelineStates from './components/admin/pipeline-states';

export default (
  <Route path="/" component={App}>
    <IndexRedirect to="/login" />
    <Route path="login" component={Login} />
    <Route path="signup" component={Signup} />
    <Route path="forgot-password" component={ForgotPassword} />
    <Route path="reset-password" component={ResetPassword} />
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
        <IndexRoute component={ComputationsListContainer} />
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
      <Route path="data-discovery" component={RouteContainer}>
        <IndexRoute component={DataDiscovery} />
        <Route path="new" component={EditDataset} />
        <Route path=":datasetId" component={EditDataset} />
      </Route>
      <Route path="admin" component={Admin}>
        {/* <Route path="user-accounts" component={UserAccounts} /> */}
        {/* <Route path="permissions" component={Permissions} />
        <Route path="pipeline-states" component={PipelineStates} /> */}
      </Route>
    </Route>
  </Route>
);
