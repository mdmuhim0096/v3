
// // src/components/GroupCallUI.jsx
// import React, { useRef, useEffect, useState } from "react";
// import {
//   startMedia,
//   createCall,
//   receiveCall,
//   toggleMute,
//   hangUp,
// } from "../utils/groupVideoCallUtils";
// import { useLocation, useNavigate } from "react-router-dom"

// const GroupVideoCall = () => {
//   const localVideoRef = useRef(null);
//   const remoteVideoRef = useRef(null);
//   const [muted, setMuted] = useState(false);
//   const [callReceived, setCallReceived] = useState(false);
//   const { callId, role } = useLocation()?.state || {};
//   const navigate = useNavigate();


//   useEffect(() => {
//     // Start media and auto-initiate call when component mounts
//     const initCall = async () => {
//       await startMedia(localVideoRef);
//       if (role === "caller") {
//         await createCall(callId, remoteVideoRef);
//       }
//     };
//     initCall();
//   }, [callId]);

//   const handleReceive = async () => {
//     setCallReceived(true);
//     await receiveCall(callId, remoteVideoRef);
//   };

//   const handleMuteToggle = () => {
//     const isNowMuted = toggleMute();
//     setMuted(isNowMuted);
//   };

//   const handleHangUp = () => {
//     hangUp(callId);
//     navigate("/chatroom");
//     window.location.reload(); // or navigate away
//   };

//   return (
//     <div className="group-call-ui">
//       <div className="video-container">
//         <video ref={localVideoRef} autoPlay muted playsInline className="video" />
//         <video ref={remoteVideoRef} autoPlay playsInline className="video" />
//       </div>

//       <div className="controls">
//         <button onClick={() => {handleReceive(); remoteVideoRef.current?.play()}}>
//           📞 Receive Call
//         </button>
//         <button onClick={handleMuteToggle}>{muted ? "🎤 Unmute" : "🔇 Mute"}</button>
//         <button onClick={handleHangUp}>❌ Hang Up</button>
//       </div>
//     </div>
//   );
// };

// export default GroupVideoCall;


// GroupVideoCall.jsx
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

  useEffect(() => {
    const initCall = async () => {
      await startMedia(localVideoRef);
      if (role === "caller") {
        await createCall(callId, remoteVideoRef);
      }
    };

    initCall();

    const checkRef = setInterval(() => {
      if (remoteVideoRef.current) {
        console.log("✅ remoteVideoRef is ready.");
        clearInterval(checkRef);
      }
    }, 300);
  }, [callId, role]);

  const handleReceive = async () => {
    setCallReceived(true);
    await receiveCall(callId, remoteVideoRef);
  };

  const handleMuteToggle = () => {
    const isNowMuted = toggleMute();
    setMuted(isNowMuted);
  };

  const handleHangUp = () => {
    hangUp(callId);
    navigate("/chatroom");
    window.location.reload();
  };

  return (
    <div className="group-call-ui">
      <div className="video-container">
        <video ref={localVideoRef} autoPlay muted playsInline className="video" />
        <video ref={remoteVideoRef} autoPlay playsInline className="video" />
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

