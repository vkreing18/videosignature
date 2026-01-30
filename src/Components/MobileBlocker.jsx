import React from 'react';
import './MobileBlocker.css';

const MobileBlocker = () => {
  return (
    <div className="mobile-blocker-container">
      <div className="mobile-content-wrapper">
        <h1 className="mobile-title">Not Compatible with Mobile Devices</h1>
        <p className="mobile-subtitle">
          Please try accessing the website from your desktop or laptop
        </p>
      </div>
    </div>
  );
};

export default MobileBlocker;