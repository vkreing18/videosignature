import { useState, useEffect } from "react";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from "@livekit/components-react";
import infoIcon from "../assets/info-icon.svg";
import greenTick from "../assets/green-tick.svg";
import "./VideoSignature.css";
import MobileBlocker from "./MobileBlocker";

export default function VideoSignature() {
  const [token, setToken] = useState(null);
  const [isLaptop, setIsLaptop] = useState(true);

  useEffect(() => {
    const checkDevice = () => setIsLaptop(window.innerWidth >= 1024);
    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

const handleStart = async () => {
  try {
    const userId = 3232342423423432;
    // const userId = sessionStorage.getItem("userId");
    const roomName = `room-${userId}-${Date.now()}`;
    // const resp = await fetch("http://192.168.29.207:3001/api/get-token", {
    const resp = await fetch("http://localhost:3001/api/get-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomName, userId }),
    });

    const { token } = await resp.json();
    setToken(token); 
  } catch (err) {
    console.error("Error creating room:", err);
  }
};

  if (!isLaptop)
    return <MobileBlocker />;

  if (!token) {
    return (
      <div className="fullscreen-container">
        <div className="modal-card">
          <div className="header">
            <h1 className="teal-title">Video Signature Instructions</h1>
          </div>
          <div className="divider" />
          <div className="content-section">
            <div className="info-row">
              <div className="icon-circle">
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
            <div className="info-row">
              <div className="icon-circle">
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
          <div className="footer">
            <button onClick={handleStart} className="continue-button">
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="livekit-wrapper">
      <LiveKitRoom
        video={true}
        audio={true}
        token={token}
        serverUrl="wss://introductionagent-jxz70fah.livekit.cloud"
      >
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}
