import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import socket from './socket';

import {
  startGroupMedia,
  joinGroupRoom,
  listenForOffersAndAnswer,
  hangUpGroup
} from '../utils/groupvideocall';

const GroupcallVideo = () => {
  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef({});
  const [remoteStreams, setRemoteStreams] = useState({});
  const [isMuted, setIsMuted] = useState(false);

  const location = useLocation();
  const roomId = location?.state?.roomId || localStorage.getItem("groomId");
  const userId = location?.state?.userId || localStorage.getItem("myId");
  const isDail = location?.state?.isDail;

  const startGroupCall = async () => {
    try {
      const stream = await startGroupMedia(localVideoRef.current);

      if (!stream) {
        console.error("❌ Local stream unavailable");
        return;
      }

      await joinGroupRoom(roomId, userId, (peerId, stream) => {
        console.log(`✅ Received stream from peer ${peerId}`);
        setRemoteStreams(prev => ({ ...prev, [peerId]: stream }));
      });

      await listenForOffersAndAnswer(roomId, userId);
    } catch (err) {
      console.error("Error setting up group call:", err);
    }
  };

  useEffect(() => {
    startGroupCall();

    return () => {
      hangUpGroup(roomId, userId);
    };
  }, [roomId, userId]);

  useEffect(() => {
    Object.entries(remoteStreams).forEach(([peerId, stream]) => {
      const videoEl = remoteVideoRefs.current[peerId];
      if (videoEl && stream && videoEl.srcObject !== stream) {
        videoEl.srcObject = stream;
        videoEl.play().catch((e) => console.warn("AutoPlay issue:", e));
      }
    });
  }, [remoteStreams]);

  const handleMuteToggle = () => {
    const localStream = localVideoRef.current?.srcObject;
    if (!localStream) return;

    localStream.getAudioTracks().forEach(track => {
      track.enabled = !track.enabled;
    });

    setIsMuted(prev => !prev);
  };

  const handleHangUp = () => {
    hangUpGroup(roomId, userId);
    window.location.reload();
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-4">
      <h2 className="text-xl font-semibold">Group Video Call</h2>

      {/* Local Video */}
      <video
        ref={localVideoRef}
        autoPlay
        muted
        playsInline
        className="rounded-xl w-64 h-48 border shadow"
      />

      {/* Remote Videos */}
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {Object.entries(remoteStreams).map(([peerId, stream]) => (
          <video
            key={peerId}
            ref={el => (remoteVideoRefs.current[peerId] = el)}
            autoPlay
            playsInline
            muted={false}
            className="rounded-xl w-64 h-48 border shadow"
          />
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-4 mt-6">
        <button
          onClick={handleMuteToggle}
          className="bg-yellow-500 text-white px-4 py-2 rounded shadow"
        >
          {isMuted ? 'Unmute' : 'Mute'}
        </button>

        {isDail === true || isDail === "true" ? (
          <button
            onClick={handleHangUp}
            className="bg-red-600 text-white px-4 py-2 rounded shadow"
          >
            Leave Call
          </button>
        ) : (
          <span className="flex gap-6">
            <button
              onClick={startGroupCall}
              className="bg-green-600 text-white px-4 py-2 rounded shadow"
            >
              Receive Call
            </button>
            <button
              onClick={handleHangUp}
              className="bg-red-600 text-white px-4 py-2 rounded shadow"
            >
              Leave Call
            </button>
          </span>
        )}
      </div>
    </div>
  );
};

export default GroupcallVideo;
