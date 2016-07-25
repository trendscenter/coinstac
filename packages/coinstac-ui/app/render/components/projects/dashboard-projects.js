import React, { PropTypes } from 'react';

export default class DashboardProjects extends React.Component { // eslint-disable-line
  render() {
    return (
      <div className="projects">
        {this.props.children}
      </div>
    );
  }
}

DashboardProjects.propTypes = {
  children: PropTypes.element,
};
