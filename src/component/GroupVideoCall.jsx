import React, { useEffect, useRef, useState } from "react";
import {
  startMedia,
  createCall,
  receiveCall,
  hangUp,
  toggleMute,
  listenForAnswers,
  listenForCandidates,
} from "../utils/groupVideoCallUtils";

import { useLocation, useNavigate } from "react-router-dom";
import { get, ref } from "firebase/database";
import { database } from "../firebase";

const GroupVideoCall = () => {
  const { roomId, userId, isCaller } = useLocation()?.state || {};
  const navigate = useNavigate();

  const localRef = useRef(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const setup = async () => {
      try {
        const stream = await startMedia();
        if (localRef.current) {
          localRef.current.srcObject = stream;
        }

        if (isCaller) {
          // Allow caller to generate an offer for anyone to receive
          await createCall(roomId, userId, "any");

          // Listen for receivers who reply
          listenForAnswers(roomId, userId, (stream, peerId) => {
            setRemoteStreams((prev) => ({ ...prev, [peerId]: stream }));
          });

          listenForCandidates(roomId, userId);
        }
      } catch (err) {
        console.error("❌ Call setup error:", err);
        alert("❌ Failed to start call.");
      }
    };

    setup();

    return () => {
      hangUp(roomId);
    };
  }, []);

  const handleReceive = async () => {
    try {
      const offersRef = ref(database, `rooms/${roomId}/offers`);
      const snapshot = await get(offersRef);
      if (snapshot.exists()) {
        const offers = snapshot.val();
        const [callerId] = Object.keys(offers);
        await receiveCall(roomId, callerId, userId, (stream, peerId) => {
          setRemoteStreams((prev) => ({ ...prev, [peerId]: stream }));
        });

        listenForCandidates(roomId, userId);
      } else {
        alert("❌ No incoming calls found.");
      }
    } catch (err) {
      console.error("❌ Receive call error:", err);
    }
  };

  const handleMute = () => {
    const isNowMuted = toggleMute();
    setMuted(isNowMuted);
  };

  const hangUpCall = () => {
    hangUp(roomId);
    navigate("/chatroom");
    window.location.reload();
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Room: {roomId}</h2>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {/* Local video */}
        <div>
          <p><strong>You</strong></p>
          <video
            ref={localRef}
            autoPlay
            muted
            playsInline
            style={{ width: 200, border: "2px solid #444", borderRadius: 8 }}
          />
        </div>

        {/* Remote video streams */}
        {Object.entries(remoteStreams).map(([uid, stream]) => (
          <VideoTile key={uid} stream={stream} userId={uid} />
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        {!isCaller && <button onClick={handleReceive}>📞 Receive Call</button>}
        <button onClick={handleMute}>{muted ? "🔇 Unmute" : "🔊 Mute"}</button>
        <button onClick={hangUpCall}>❌ Hang Up</button>
      </div>
    </div>
  );
};

const VideoTile = ({ stream, userId }) => {
  const videoRef = useRef();

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div>
      <p><strong>{userId}</strong></p>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ width: 200, border: "2px solid #888", borderRadius: 8 }}
      />
    </div>
  );
};

export default GroupVideoCall;
