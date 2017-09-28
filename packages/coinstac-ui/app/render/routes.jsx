/**
 * Use React Router to implement application routing.
 *
 * @{@link  http://rackt.github.io/react-router/}
 * @{@link  https://github.com/rackt/react-router}
 */
import { Route, IndexRoute } from 'react-router';
import React from 'react';
import App from './components/app';
import ComputationSubmission from './components/computation-submission';
import ConsortiaList from './components/consortium/consortia-list';
import ConsortiumTabs from './components/consortium/consortium-tabs';
import Dashboard from './components/dashboard';
import DashboardHome from './components/dashboard-home';
import RouteContainer from './containers/route-container';
import Login from './components/form-login-controller';
import Signup from './components/form-signup-controller';
import Test from './components/feature-test';
import PipelinesList from './components/pipelines/pipelines-list';
import Pipeline from './components/pipelines/pipeline';
import ProjectsList from './components/projects/projects-list';
import FormProjectController from './components/projects/form-project-controller';

import Settings from './components/settings';

export default (
  <Route component={App}>
    <Route path="login" component={Login} />
    <Route path="signup" component={Signup} />
    <Route path="/" component={Dashboard} >
      <IndexRoute component={DashboardHome} />
      <Route path="consortia" component={RouteContainer}>
        <IndexRoute component={ConsortiaList} />
        <Route path="new" component={ConsortiumTabs} />
        <Route path=":consortiumId" component={ConsortiumTabs} />
      </Route>
      <Route path="my-files" component={RouteContainer}>
        <IndexRoute component={ProjectsList} />
        <Route path="new" component={FormProjectController} />
        <Route path=":projectId" component={FormProjectController} />
      </Route>
      <Route path="pipelines" component={RouteContainer}>
        <IndexRoute component={PipelinesList} />
        <Route path="new(/:consortiumId)" component={Pipeline} />
        <Route path=":pipelineId" component={Pipeline} />
      </Route>
      <Route path="settings" component={Settings} />
      <Route path="submit-computation" component={ComputationSubmission} />
      <Route path="test" component={Test} />
    </Route>
  </Route>
);
