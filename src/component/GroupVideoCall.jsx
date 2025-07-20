import React, { useRef, useEffect, useState } from "react";
import {
  startMedia,
  createCall,
  receiveCall,
  toggleMute,
  hangUp,
} from "../utils/groupVideoCallUtils";
import { useLocation, useNavigate } from "react-router-dom";

const GroupVideoCall = () => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [muted, setMuted] = useState(false);
  const [callReceived, setCallReceived] = useState(false);
  const { callId, role } = useLocation()?.state || {};
  const navigate = useNavigate();
  const cleanupRef = useRef(null); // ✅ Store cleanup

  useEffect(() => {
    const init = async () => {
      await startMedia(localVideoRef);

      if (role === "caller") {
        await createCall(callId, remoteVideoRef);
      }
    };

    init();

    return () => {
      if (cleanupRef.current) {
        console.log("🧹 Cleaning up call...");
        cleanupRef.current(); // ✅ Clean up peer connection & listeners
      }
    };
  }, [callId, role]);

  const handleReceive = async () => {
    setCallReceived(true);
    cleanupRef.current = await receiveCall(callId, remoteVideoRef, localVideoRef); // ✅ Store cleanup
  };

  const handleMuteToggle = () => {
    const isNowMuted = toggleMute();
    setMuted(isNowMuted);
  };

  const handleHangUp = async () => {
    await hangUp(callId);
    if (cleanupRef.current) cleanupRef.current(); // Optional manual cleanup on hangup
    navigate("/chatroom");
  };

  return (
    <div className="group-call-ui">
      <div className="video-container">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="video local-video"
        />
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="video remote-video"
        />
      </div>

      <div className="controls">
        <button onClick={handleReceive} disabled={callReceived}>
          📞 Receive Call
        </button>
        <button onClick={handleMuteToggle}>
          {muted ? "🎤 Unmute" : "🔇 Mute"}
        </button>
        <button onClick={handleHangUp}>❌ Hang Up</button>
      </div>
    </div>
  );
};

export default GroupVideoCall;
