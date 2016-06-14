import React, { PropTypes } from 'react';

export default class DashboardProjects extends React.Component { // eslint-disable-line
  render() {
    return (
      <div className="projects">
        <div className="page-header clearfix">
          <h1 className="pull-left">Projects</h1>
        </div>
        {this.props.children}
      </div>
    );
  }
}

DashboardProjects.propTypes = {
  children: PropTypes.array,
};
