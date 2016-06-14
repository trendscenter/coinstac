'use strict';
import React from 'react';
import welcomeContent from '../content/welcome.md';

export default class DashboardHome extends React.Component {
    render() {
        return (
            <div className="dashboard-home">
                <div className="page-header">
                    <div dangerouslySetInnerHTML={{__html: welcomeContent}} />
                </div>
            </div>
        );
    }
};
