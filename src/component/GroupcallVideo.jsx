

import React, { useEffect, useRef, useState } from "react";
import {
  startGroupMedia,
  joinGroupRoom,
  listenForOffers,
  manuallyAnswerOffer,
  callPeer,
  hangUpGroup
} from "../utils/groupvideocall";
import { useLocation, useNavigate } from "react-router-dom";
import { PhoneOff, Mic, MicOff } from "lucide-react";

const GroupVideoCall = () => {
  const localVideoRef = useRef(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [isMuted, setIsMuted] = useState(false);
  const [callStarted, setCallStarted] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [offers, setOffers] = useState({}); // Offers received from other peers

  const location = useLocation();
  const navigate = useNavigate();
  const roomId = location?.state?.roomId || "defaultRoom";
  const userId = `user-${localStorage.getItem("myId")}`;

  useEffect(() => {
    const init = async () => {
      try {
        const stream = await startGroupMedia(localVideoRef.current);
        setLocalStream(stream);
        await joinGroupRoom(roomId, userId);

        // Automatically send offers to everyone else
        setCallStarted(true);

        // Listen for offers (to be accepted manually)
        listenForOffers(roomId, userId, (fromId, offer) => {
          setOffers((prev) => ({ ...prev, [fromId]: offer }));
        });
      } catch (error) {
        console.error("Init error:", error.message);
      }
    };

    init();
  }, []);

  // 🟢 Accept an incoming offer manually
const handleReceiveCall = async (peerId) => {
  const offer = offers[peerId];
  if (!offer) return;

  await manuallyAnswerOffer(roomId, userId, peerId, offer, (peerId, stream) => {
    setRemoteStreams((prev) => ({ ...prev, [peerId]: stream }));
  });

  // Optionally clear the offer after accepted
  setOffers((prev) => {
    const updated = { ...prev };
    delete updated[peerId];
    return updated;
  });
};


  // 🔴 Hang up
  const handleHangUp = async () => {
    await hangUpGroup(roomId, userId);

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    setCallStarted(false);
    setRemoteStreams({});
    navigate("/chatroom");
  };

  // 🎤 Mute/unmute mic
  const toggleMute = () => {
    if (!localStream) return;
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold text-center">Room ID: {roomId}</h2>

      <div className="flex justify-center gap-4">
        {Object.keys(offers).map((fromId) => (
          <button
            key={fromId}
            onClick={() => handleReceiveCall(fromId)}
            className="text-green-600 px-4 py-2 bg-white shadow rounded"
          >
            Accept from {fromId}
          </button>
        ))}

        <button onClick={handleHangUp} className="text-red-600 px-4 py-2 bg-white shadow rounded">
          <PhoneOff />
        </button>

        <button
          onClick={toggleMute}
          disabled={!callStarted}
          className="bg-gray-700 text-white px-4 py-2 rounded shadow"
        >
          {isMuted ? <MicOff /> : <Mic />}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="rounded-xl border shadow"
        />
        {Object.entries(remoteStreams).map(([peerId, stream]) => (
          <video
            key={peerId}
            autoPlay
            playsInline
            ref={(video) => {
              if (video) video.srcObject = stream;
            }}
            className="rounded-xl border shadow"
          />
        ))}
      </div>
    </div>
  );
};

export default GroupVideoCall;
