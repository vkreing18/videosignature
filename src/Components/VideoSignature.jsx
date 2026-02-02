import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoTrack,
  useTracks,
  useRoomContext,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import infoIcon from "../assets/info-icon.svg";
import greenTick from "../assets/green-tick.svg";
import "./VideoSignature.css";
import MobileBlocker from "./MobileBlocker";

export default function VideoSignature() {
  const [token, setToken] = useState(null);
  const [isLaptop, setIsLaptop] = useState(true);
  const [isLoading, setIsLoading] = useState(false); // New Loading State
  const navigate = useNavigate();

  useEffect(() => {
    const checkDevice = () => setIsLaptop(window.innerWidth >= 1024);
    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  const handleStart = async () => {
    setIsLoading(true); // Start loading immediately
    try {
      // 1. Request Browser Permissions
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      
      // 2. Fetch Token Only After Permission Granted
      const userId = "3232342423423432";
      const roomName = `room-${userId}-${Date.now()}`;
      const resp = await fetch("http://localhost:3001/api/get-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomName,
          userId,
          participantName: "Sahid Mirza",
        }),
      });

      const { token: receivedToken } = await resp.json();
      if (receivedToken) {
        setToken(receivedToken); // This triggers the transition to recording UI
      }
    } catch (err) {
      console.error("Error starting signature process:", err);
      alert("Camera and Microphone access are required to proceed.");
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  if (!isLaptop) return <MobileBlocker />;

  // STAY ON INSTRUCTION PAGE TILL TOKEN IS READY
  if (!token) {
    return (
      <div className="app-dark-bg">
        <div className="instruction-modal">
          <div className="modal-header">
            <h1 className="teal-title">Video Signature Instructions</h1>
          </div>
          <div className="divider" />
          <div className="modal-body">
            <div className="instruction-item">
              <div className="icon-circle teal-glow">
                <img src={infoIcon} alt="Info" className="icon-img" />
              </div>
              <div className="text-container">
                <h3 className="sub-heading">What is a Video Signature?</h3>
                <p className="body-text">
               A video signature is used to verify your identity. It ensures that
you are the person actually giving the interview by capturing a
short video recording of you answering a question.
                </p>
              </div>
            </div>
            <div className="instruction-item">
              <div className="icon-circle teal-check">
                <img src={greenTick} alt="Success" className="icon-img" />
              </div>
              <div className="text-container">
                <h3 className="sub-heading">What to Do Next?</h3>
                <p className="body-text">
                 On the next screen, you'll be asked to allow camera and
microphone access. You'll then answer a simple question
within 2 minutes. Your response will be recorded and
submitted automatically.
                </p>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button 
              onClick={handleStart} 
              className={`teal-continue-btn ${isLoading ? 'loading-btn' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="btn-loader"></span>
              ) : (
                "Continue"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-dark-bg">
      <LiveKitRoom
        video={true}
        audio={true}
        token={token}
        serverUrl="wss://introductionagent-jxz70fah.livekit.cloud"
        onDisconnected={() => navigate("/preview")}
      >
        <RecordingInterface onComplete={() => navigate("/preview")} />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}

// RecordingInterface remains unchanged, timer starts only on localTrack detection
function RecordingInterface({ onComplete }) {
  const room = useRoomContext();
  const tracks = useTracks([{ source: Track.Source.Camera, attach: true }]);
  const [timeLeft, setTimeLeft] = useState(120);
  const [showStop, setShowStop] = useState(false);
  const localTrack = tracks.find((t) => t.participant.isLocal);

  useEffect(() => {
    if (!localTrack) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onComplete();
          return 0;
        }
        if (prev === 110) setShowStop(true);
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [localTrack, onComplete]);

  return (
    <div className="recording-panel">
      <h2 className="teal-title">Record Your Video Signature</h2>
      <div className="divider" />
      <div className="compact-video-viewport">
        {localTrack ? (
          <>
            <VideoTrack trackRef={localTrack} className="signature-video" />
            <div className="live-rec-pill">● Rec</div>
          </>
        ) : (
          <div className="loading">Starting camera...</div>
        )}
      </div>
      <div className="countdown-section">
        <div className="big-time">{Math.floor(timeLeft / 60)}m {timeLeft % 60}s</div>
        <div className="time-sub">Time remaining</div>
      </div>
      <div className="footer-action">
        {showStop && (
          <button className="dark-stop-btn" onClick={() => { room.disconnect(); onComplete(); }}>
            Stop Recording
          </button>
        )}
      </div>
    </div>
  );
}