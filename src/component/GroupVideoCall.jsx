// src/components/GroupCall.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  startMedia,
  createCall,
  receiveCall,
  toggleMute,
  hangUp
} from "../utils/groupVideoCallUtils";
import { useLocation, useNavigate } from "react-router-dom"

const GroupCall = () => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [joined, setJoined] = useState(false);
  const { callId, role } = useLocation()?.state || {}
  const navigate = useNavigate();
  useEffect(() => {
    const media = async () => {
       await startMedia(localVideoRef.current);
    }
    media();
  }, []);
  
  const handleCreate = async () => {
    await createCall(callId, remoteVideoRef);
    setJoined(true);
  };

  useEffect(() => {
    if (role === "caller") {
      handleCreate();
    }
  }, [])

  const handleReceive = async () => {
    await receiveCall(callId, remoteVideoRef);
    setJoined(true);
  };

  const handleLeave = async () => {
    await hangUp(callId);
    setJoined(false);
    navigate("/chatroom")
    window.location.reload();
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Simple Video Call</h1>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full bg-black rounded" />
          <p className="text-center mt-1">You</p>
        </div>
        <div>
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full bg-black rounded" />
          <p className="text-center mt-1">Remote</p>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        {role !== "caller" ? <button onClick={handleReceive} className="bg-green-600 text-white px-4 py-2 rounded">
          Receive Call
        </button> : null}
        <button onClick={toggleMute} className="bg-yellow-500 text-white px-4 py-2 rounded">
          Mute/Unmute
        </button>
        <button onClick={handleLeave} className="bg-red-600 text-white px-4 py-2 rounded">
          Leave
        </button>
      </div>
    </div>
  );
};

export default GroupCall;
