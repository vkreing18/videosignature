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
  const navigate = useNavigate();

  useEffect(() => {
    const checkDevice = () => setIsLaptop(window.innerWidth >= 1024);
    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  const handleStart = async () => {
    try {
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
      if (receivedToken) setToken(receivedToken);
    } catch (err) {
      console.error("Error creating room:", err);
    }
  };

  if (!isLaptop) return <MobileBlocker />;

  if (!token) {
    return (
      <div className="app-dark-bg">
        <div className="instruction-modal">
          <div className="modal-header">
            <h1 className="teal-title">Video Signature Instructions</h1>
            {/* <button className="close-x-btn">✕</button> */}
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
                  A video signature is used to verify your identity. It ensures
                  that you are the person actually giving the interview by
                  capturing a short video recording of you answering a question.
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
                  microphone access. You'll then answer a simple question within
                  2 minutes. Your response will be recorded and submitted
                  automatically.
                </p>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button onClick={handleStart} className="teal-continue-btn">
              Continue
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

function RecordingInterface({ onComplete }) {
  const room = useRoomContext();
  const tracks = useTracks([{ source: Track.Source.Camera, attach: true }]);
  const [timeLeft, setTimeLeft] = useState(120);
  const [showStop, setShowStop] = useState(false);
  const localTrack = tracks.find((t) => t.participant.isLocal);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onComplete();
          return 0;
        }
        if (prev === 110) setShowStop(true);
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="recording-panel">
      <h2 className="teal-title">Record Your Video Signature</h2>
      <div className="divider" />
      <div className="compact-video-viewport">
        {localTrack ? (
          <VideoTrack trackRef={localTrack} className="signature-video" />
        ) : (
          <div className="loading">Starting...</div>
        )}
        <div className="live-rec-pill">● Rec</div>
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
