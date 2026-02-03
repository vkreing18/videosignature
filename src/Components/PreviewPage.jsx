import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./VideoSignature.css";
import MobileBlocker from "./MobileBlocker";

export default function PreviewPage() {
  const [isLaptop, setIsLaptop] = useState(true);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { userid } = location.state || {};

  const videoUrl = userid 
    ? `${import.meta.env.VITE_VIDEO_BASE_URL}videoSignature/${userid}/${userid}.mp4`
    : null;

  useEffect(() => {
    const checkDevice = () => setIsLaptop(window.innerWidth >= 1024);
    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  // Polling logic to wait for the backend to save the video
  useEffect(() => {
    if (!videoUrl || isVideoReady || retryCount > 10) return;

    const checkVideoAvailability = async () => {
      try {
        const response = await fetch(videoUrl, { method: 'HEAD' });
        if (response.ok) {
          setIsVideoReady(true);
        } else {
          // If not ready, wait 2 seconds and try again
          setTimeout(() => setRetryCount(prev => prev + 1), 2000);
        }
      } catch (error) {
        setTimeout(() => setRetryCount(prev => prev + 1), 2000);
      }
    };

    checkVideoAvailability();
  }, [videoUrl, isVideoReady, retryCount]);

  if (!isLaptop) return <MobileBlocker />;

  return (
    <div className="app-dark-bg">
      <div className="instruction-modal">
        <h2 className="teal-title">Your recorded signature</h2>
        <div className="divider" />

        <div className="compact-video-viewport">
          {!isVideoReady ? (
            <div className="loading-container" style={{ textAlign: 'center' }}>
              <div className="btn-loader" style={{ margin: '0 auto 15px auto', borderColor: 'rgba(14, 201, 158, 0.2)', borderTopColor: '#0ec99e' }}></div>
              <p className="body-text">Processing your video...</p>
            </div>
          ) : (
            <video
              width="100%"
              height="100%"
              controls
              playsInline
              preload="auto"
              style={{ borderRadius: "18px", objectFit: "cover", backgroundColor: "#000" }}
            >
              <source src={`${videoUrl}?t=${Date.now()}`} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          )}
        </div>

        <div className="preview-action-footer">
          <button 
            className="re-record-btn" 
            onClick={() => navigate("/videosignature")}
            disabled={!isVideoReady && retryCount < 10}
          >
            Re-record
          </button>
          <button 
            className={`teal-continue-btn ${!isVideoReady ? 'disabled-btn' : ''}`} 
            onClick={() => navigate("/completed")}
            disabled={!isVideoReady}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}