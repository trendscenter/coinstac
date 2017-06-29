/**
 * Use React Router to implement application routing.
 *
 * @{@link  http://rackt.github.io/react-router/}
 * @{@link  https://github.com/rackt/react-router}
 */
import App from './components/app';
import Dashboard from './components/dashboard';
import DashboardHome from './components/dashboard-home';
import DashboardConsortia from './components/dashboard-consortia';
import Login from './components/form-login-controller';
import Signup from './components/form-signup-controller';
import DashboardProjects from './components/projects/dashboard-projects';
import ProjectsList from './components/projects/projects-list';
import ConsortiumController from './components/consortium/consortium-controller';
import FormProjectController from './components/projects/form-project-controller';
import { Route, IndexRoute } from 'react-router';
import React from 'react';

import Settings from './components/settings';

export default (
  <Route component={App}>
    <Route path="login" component={Login} />
    <Route path="signup" component={Signup} />
    <Route path="/" component={Dashboard} >
      <IndexRoute component={DashboardHome} />
      <Route path="/consortia" component={DashboardConsortia} />
      <Route path="/consortia/new" component={ConsortiumController} />
      <Route path="/consortia/:consortiumId(/:resultId)" component={ConsortiumController} />
      <Route path="/my-files" component={DashboardProjects}>
        <IndexRoute component={ProjectsList} />
        <Route path="new" component={FormProjectController} />
        <Route path=":projectId" component={FormProjectController} />
      </Route>
      <Route path="/settings" component={Settings} />
    </Route>
  </Route>
);
