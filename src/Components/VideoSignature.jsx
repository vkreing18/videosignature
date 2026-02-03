import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoTrack,
  useTracks,
  useRoomContext,
  useLocalParticipant,
} from "@livekit/components-react";
import { Track } from "livekit-client";

/* Correct Krisp Imports */
import { 
  KrispNoiseFilter, 
  isKrispNoiseFilterSupported 
} from "@livekit/krisp-noise-filter";

import infoIcon from "../assets/info-icon.svg";
import greenTick from "../assets/green-tick.svg";
import "./VideoSignature.css";
import MobileBlocker from "./MobileBlocker";

/* 1. Krisp Activator Sub-component */
function KrispActivator() {
  const { microphoneTrack } = useLocalParticipant();

  useEffect(() => {
    // Only attempt to enable if the microphone track is actually published/available
    if (!microphoneTrack || !microphoneTrack.track) return;

    const enableKrisp = async () => {
      try {
        /* FIX: Use the correct standalone function for support checking */
        if (isKrispNoiseFilterSupported()) {
          console.log("Initializing Krisp...");
          
          // Initialize the filter instance
          const krisp = KrispNoiseFilter();
          
          // Apply the processor to the audio track
          await microphoneTrack.track.setProcessor(krisp);
          
          // Optionally ensure it is enabled (it usually is by default)
          if (typeof krisp.setEnabled === 'function') {
            await krisp.setEnabled(true);
          }
          
          console.log("✅ Krisp noise cancellation enabled");
        } else {
          console.warn("❌ Krisp not supported on this browser/environment");
        }
      } catch (err) {
        console.error("Failed to initialize Krisp:", err);
      }
    };

    enableKrisp();

    // Cleanup: Remove processor when component unmounts to prevent audio issues
    return () => {
      if (microphoneTrack?.track?.getProcessor()) {
        microphoneTrack.track.stopProcessor();
        console.log("Krisp processor stopped");
      }
    };
  }, [microphoneTrack]);

  return null;
}

export default function VideoSignature() {
  const [token, setToken] = useState(null);
  const [isLaptop, setIsLaptop] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const userId = "634d1cab101fea9449a9e890r";

  useEffect(() => {
    const checkDevice = () => setIsLaptop(window.innerWidth >= 1024);
    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  const handleStart = async () => {
    setIsLoading(true);
    try {
      // Pre-check permissions
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

      const roomName = `${userId}`;
      const resp = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/get-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName, participantName: "Sahid Mirza" }),
      });

      const { token: receivedToken } = await resp.json();
      if (receivedToken) setToken(receivedToken);
    } catch (err) {
      console.error("Error starting signature process:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLaptop) return <MobileBlocker />;

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
                  A video signature is used to verify your identity by capturing 
                  a short video recording of you answering a question.
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
                  On the next screen, you'll answer a question within 2 minutes. 
                  Your response will be recorded automatically.
                </p>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button
              onClick={handleStart}
              className={`teal-continue-btn ${isLoading ? "loading-btn" : ""}`}
              disabled={isLoading}
            >
              {isLoading ? <span className="btn-loader"></span> : "Continue"}
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
        serverUrl={import.meta.env.VITE_LIVEKIT_URL}
      >
        <KrispActivator />
        <RecordingInterface onComplete={() => navigate("/preview", { state: { userid: userId } })} />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}

function RecordingInterface({ onComplete }) {
  const room = useRoomContext();
  const tracks = useTracks([{ source: Track.Source.Camera, attach: true }]);
  const [timeLeft, setTimeLeft] = useState(120);
  const [showStop, setShowStop] = useState(false);
  const localTrack = tracks.find((t) => t.participant.isLocal);

  useEffect(() => {
    const startTime = Date.now();
    const totalDuration = 120 * 1000;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, Math.ceil((totalDuration - elapsed) / 1000));

      setTimeLeft(remaining);

      if (elapsed >= 10000) {
        setShowStop(true);
      }

      if (elapsed >= totalDuration) {
        clearInterval(timer);
        room.disconnect();
        onComplete();
      }
    }, 100);

    return () => clearInterval(timer);
  }, [onComplete, room]);

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
        <div className="big-time">
          {Math.floor(timeLeft / 60)}m {timeLeft % 60}s
        </div>
        <div className="time-sub">Time remaining</div>
      </div>
      <div className="footer-action">
        {showStop && (
          <button
            className="dark-stop-btn"
            onClick={() => {
              room.disconnect();
              onComplete();
            }}
          >
            Stop Recording
          </button>
        )}
      </div>
    </div>
  );
}