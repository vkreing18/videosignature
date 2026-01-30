import React, { useState, useEffect } from 'react';
import './EndPage.css';
import greenTick from '../assets/green-tick.svg';
import MobileBlocker from './MobileBlocker'; 

export default function EndPage() {
  const [isLaptop, setIsLaptop] = useState(true);

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)');
    const handler = (e) => setIsLaptop(e.matches);
    
    setIsLaptop(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const handleNext = () => {
    window.location.href = '/dashboard'; 
  };

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
        <button onClick={handleNext} className="next-button">
          Next
        </button>
      </div>
    </div>
  );
}