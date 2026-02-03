import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoTrack,
  useTracks,
  useRoomContext,
  useLocalParticipant,
  useRemoteParticipants,
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
    if (!microphoneTrack || !microphoneTrack.track) return;

    const enableKrisp = async () => {
      try {
        if (isKrispNoiseFilterSupported()) {
          console.log("Initializing Krisp...");
          const krisp = KrispNoiseFilter();
          await microphoneTrack.track.setProcessor(krisp);
          
          if (typeof krisp.setEnabled === 'function') {
            await krisp.setEnabled(true);
          }
          console.log("✅ Krisp noise cancellation enabled");
        }
      } catch (err) {
        console.error("Failed to initialize Krisp:", err);
      }
    };

    enableKrisp();

    return () => {
      if (microphoneTrack?.track?.getProcessor()) {
        microphoneTrack.track.stopProcessor();
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
  const userId = "634d1cab101fea9449a9e890a";

  useEffect(() => {
    const checkDevice = () => setIsLaptop(window.innerWidth >= 1024);
    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  const handleStart = async () => {
    // Prevent "reading getUserMedia" error by checking support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Camera access requires a secure context (HTTPS or localhost).");
        return;
    }

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
      alert("Please ensure your camera and microphone are connected and allowed.");
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
                  On the next screen, the timer will start once the agent joins. 
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
  const remoteParticipants = useRemoteParticipants();
  const tracks = useTracks([{ source: Track.Source.Camera, attach: true }]);
  
  const [timeLeft, setTimeLeft] = useState(120);
  const [showStop, setShowStop] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [isTimerActive, setIsTimerActive] = useState(false);

  const localTrack = tracks.find((t) => t.participant.isLocal);

  // Activate timer when agent (remote participant) joins
  useEffect(() => {
    if (remoteParticipants.length > 0 && !isTimerActive) {
      console.log("Agent joined - starting timer.");
      setIsTimerActive(true);
    }
  }, [remoteParticipants, isTimerActive]);

  const handleFinalizeRecording = async () => {
    setIsStopping(true);
    try {
      // Unpublish to stop data stream visually/logically
      const videoTrack = localTrack?.participant.getTrack(Track.Source.Camera);
      const audioTrack = localTrack?.participant.getTrack(Track.Source.Microphone);
      
      videoTrack?.videoTrack?.stop();
      audioTrack?.audioTrack?.stop();

      // IMPORTANT: Wait 2 seconds for server buffer sync to prevent 24s/30s video cut
      setTimeout(() => {
        room.disconnect();
        onComplete();
      }, 2000);
    } catch (err) {
      console.error("Error finishing recording:", err);
      room.disconnect();
      onComplete();
    }
  };

  useEffect(() => {
    // Only count down if timer is active and we aren't already stopping
    if (!isTimerActive || isStopping) return;

    const startTime = Date.now();
    const totalDuration = 120 * 1000;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, Math.ceil((totalDuration - elapsed) / 1000));

      setTimeLeft(remaining);

      // Show stop button after 10 seconds of active recording
      if (elapsed >= 10000) {
        setShowStop(true);
      }

      if (elapsed >= totalDuration) {
        clearInterval(timer);
        handleFinalizeRecording();
      }
    }, 100);

    return () => clearInterval(timer);
  }, [onComplete, room, isStopping, isTimerActive]);

  return (
    <div className="recording-panel">
      <h2 className="teal-title">
        {!isTimerActive 
          ? "Waiting for Agent..." 
          : isStopping 
            ? "Finalizing Signature..." 
            : "Video Signature Recording"}
      </h2>
      <div className="divider" />
      
      <div className="compact-video-viewport">
        {localTrack && !isStopping ? (
          <>
            <VideoTrack trackRef={localTrack} className="signature-video" />
            <div className={`live-rec-pill ${!isTimerActive ? "standby-pill" : ""}`}>
              {isTimerActive ? "● Rec" : "Standby"}
            </div>
          </>
        ) : (
          <div className="loading">
            {isStopping ? "Saving video..." : "Connecting camera..."}
          </div>
        )}
      </div>

      <div className="countdown-section">
        <div className={`big-time ${!isTimerActive ? "dimmed" : ""}`}>
          {Math.floor(timeLeft / 60)}m {timeLeft % 60}s
        </div>
        <p className="time-sub">
          {!isTimerActive ? "Timer starts when agent joins" : "Time remaining"}
        </p>
      </div>

      <div className="footer-action">
        {showStop && !isStopping && (
          <button
            className="dark-stop-btn"
            onClick={handleFinalizeRecording}
          >
            Stop Recording
          </button>
        )}
      </div>
    </div>
  );
}