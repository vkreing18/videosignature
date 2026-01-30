import React, { useState, useEffect } from 'react';
import './EndPage.css';
import greenTick from '../assets/green-tick.svg';
import MobileBlocker from './MobileBlocker'; // Import your blocker component

export default function EndPage() {
  const [isLaptop, setIsLaptop] = useState(true);

  // Use the optimized matchMedia approach
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)');
    const handler = (e) => setIsLaptop(e.matches);
    
    setIsLaptop(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const handleNext = () => {
    // Redirect logic
    window.location.href = '/dashboard'; 
  };

  // Block mobile access
  if (!isLaptop) {
    return <MobileBlocker />;
  }

  return (
    <div className="fullscreen-container">
      <div className="modal-card end-card">
        {/* Large Success Icon */}
        <div className="success-icon-circle">
          <img src={greenTick} alt="Success" className="success-icon-img" />
        </div>

        {/* Text Content */}
        <h1 className="success-title">Signature Submitted</h1>
        <p className="success-body">
          Your video signature has been<br />
          successfully recorded and saved.
        </p>

        {/* Action Button */}
        <button onClick={handleNext} className="next-button">
          Next
        </button>
      </div>
    </div>
  );
}