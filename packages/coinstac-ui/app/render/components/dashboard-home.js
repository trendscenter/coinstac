import React from 'react';
import welcomeContent from '../content/welcome.md';

export default function DashboardHome() {
  return (
    <div className="dashboard-home">
      <div className="page-header">
        <div dangerouslySetInnerHTML={{ __html: welcomeContent }} />
      </div>
    </div>
  );
}
