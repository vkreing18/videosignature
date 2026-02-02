import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./VideoSignature.css";
import MobileBlocker from "./MobileBlocker";

export default function PreviewPage() {
  const [isLaptop, setIsLaptop] = useState(true);
  const navigate = useNavigate();

  // Temporary video link for playback
  const videoUrl = "https://www.youtube.com/embed/x-Hs9CgbB1I";

  useEffect(() => {
    const checkDevice = () => setIsLaptop(window.innerWidth >= 1024);
    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  if (!isLaptop) return <MobileBlocker />;

  return (
    <div className="app-dark-bg">
      <div className="instruction-modal">
        <h2 className="teal-title">Your recorded signature</h2>
        <div className="divider" />

        <div className="compact-video-viewport">
          <iframe
            width="100%"
            height="100%"
            src={videoUrl}
            title="Video Preview"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ borderRadius: "18px" }}
          ></iframe>
        </div>

        <div className="preview-action-footer">
          <button 
            className="re-record-btn" 
            onClick={() => navigate("/videosignature")}
          >
            Re-record
          </button>
          <button 
            className="teal-continue-btn" 
            onClick={() => navigate("/completed")}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}