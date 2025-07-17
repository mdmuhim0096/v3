// src/components/GroupVideoCall.jsx
import React, { useEffect, useRef, useState } from "react";
import { database, ref, set, onValue, remove } from "../firebase";
import {
  getLocalStream,
  createPeerConnection,
  getPeers,
  closeAllConnections,
} from "../utils/webrtcUtils";
import { useNavigate, useLocation } from "react-router-dom";
import socket from "./socket";
import { Phone, PhoneOff, Mic, MicOff } from "lucide-react";

const GroupVideoCall = () => {
  const localVideoRef = useRef();
  const [remoteStreams, setRemoteStreams] = useState({});
  const [isMuted, setIsMuted] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [callStarted, setCallStarted] = useState(false);

  const userId = useRef(`user-${localStorage.getItem("myId")}`);
  const navigate = useNavigate();
  const location = useLocation();
  const { roomId, role } = location?.state || {};

  useEffect(() => {
    if (!roomId) {
      navigate("/chatroom");
      return;
    }

    const signalRef = ref(database, `signals/${roomId}/${userId.current}`);
    onValue(signalRef, async (snapshot) => {
      const signals = snapshot.val();
      if (!signals) return;

      for (const sender in signals) {
        const signal = signals[sender];
        const pc = getPeers()[sender] ||
          createPeerConnection(sender, (peerId, stream) => {
            setRemoteStreams((prev) => ({ ...prev, [peerId]: stream }));
          });

        if (signal.type === "offer") {
          if (pc.signalingState !== "stable") {
            console.warn("⚠️ Skipping offer: PC not in stable state", pc.signalingState);
            continue;
          }

          console.log("📥 Received offer from", sender);
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await set(ref(database, `signals/${roomId}/${sender}/${userId.current}`), {
            type: "answer",
            sdp: answer,
          });
        } else if (signal.type === "answer") {
          if (!pc.currentRemoteDescription) {
            console.log("📥 Received answer from", sender);
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          } else {
            console.warn("⚠️ Skipping duplicate or invalid answer from", sender);
          }
        }
      }
    });



    return () => {
      closeAllConnections();
      remove(ref(database, `rooms/${roomId}/${userId.current}`));
      remove(ref(database, `signals/${roomId}/${userId.current}`));
    };
  }, [roomId]);

  const handleStartCall = async () => {
    const stream = await getLocalStream();
    setLocalStream(stream);
    localVideoRef.current.srcObject = stream;

    const roomRef = ref(database, `rooms/${roomId}`);
    const peerRef = ref(database, `rooms/${roomId}/${userId.current}`);
    await set(peerRef, { joined: Date.now() });
    socket.emit("join_room", roomId);

    onValue(roomRef, async (snapshot) => {
      const users = snapshot.val();
      if (!users) return;

      for (const peerKey of Object.keys(users)) {
        if (peerKey === userId.current) continue;
        if (!getPeers()[peerKey]) {
          const pc = createPeerConnection(peerKey, (peerId, stream) => {
            setRemoteStreams((prev) => ({ ...prev, [peerId]: stream }));
          });

          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await set(ref(database, `signals/${roomId}/${peerKey}/${userId.current}`), {
            type: "offer",
            sdp: offer,
          });
        }
      }
    });

    setCallStarted(true);
  };

  useEffect(() => {
    handleStartCall();
  }, []);

  const handleReceiveCall = async () => {
    const stream = await getLocalStream();
    setLocalStream(stream);
    localVideoRef.current.srcObject = stream;

    const peerRef = ref(database, `rooms/${roomId}/${userId.current}`);
    await set(peerRef, { joined: Date.now() });
    setCallStarted(true);
  };

  const handleHangUp = async () => {
    await remove(ref(database, `rooms/${roomId}/${userId.current}`));
    await remove(ref(database, `signals/${roomId}/${userId.current}`));
    closeAllConnections();

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    setRemoteStreams({});
    setCallStarted(false);
    navigate("/chatroom");
  };

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
        <button
          onClick={handleReceiveCall}
          disabled={callStarted}
          className="text-green-500 cursor-pointer"
        >
          <Phone />
        </button>
        <button onClick={handleHangUp} className="text-red-600">
          <PhoneOff />
        </button>
        <button
          onClick={toggleMute}
          disabled={!callStarted}
          className="bg-gray-700 text-white px-4 py-2 rounded shadow"
        >
          {isMuted ? <Mic /> : <MicOff />}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="rounded-xl border shadow"
        />
        {Object.entries(remoteStreams).map(([peerId, stream]) => (
          <video
            key={peerId}
            autoPlay
            playsInline
            ref={(video) => video && (video.srcObject = stream)}
            className="rounded-xl border shadow"
          />
        ))}
      </div>
    </div>
  );
};

export default GroupVideoCall;
