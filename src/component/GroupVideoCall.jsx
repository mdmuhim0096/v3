// // src/components/GroupCall.jsx
// import React, { useEffect, useRef, useState } from "react";
// import {
//   startMedia,
//   createCall,
//   receiveCall,
//   toggleMute,
//   hangUp
// } from "../utils/groupVideoCallUtils";
// import { useLocation, useNavigate } from "react-router-dom"

// const GroupCall = () => {
//   const localVideoRef = useRef(null);
//   const remoteVideoRef = useRef(null);
//   const [joined, setJoined] = useState(false);
//   const { callId, role } = useLocation()?.state || {}
//   const navigate = useNavigate();

//   useEffect(() => {
//     const media = async () => {
//       await startMedia(localVideoRef.current);
//     }
//     media();
//   }, []);

//   const handleCreate = async () => {
//     await createCall(callId, remoteVideoRef);
//     setJoined(true);
//   };

//   useEffect(() => {
//     if (role === "caller") {
//       handleCreate();
//     }
//   }, [])

//   const handleReceive = async () => {
//     await receiveCall(callId, remoteVideoRef);
//     setJoined(true);
//   };

//   const handleLeave = async () => {
//     await hangUp(callId);
//     setJoined(false);
//     navigate("/chatroom")
//     window.location.reload();
//   };

//   return (
//     <div className="p-4">
//       <h1 className="text-xl font-bold mb-4">Simple Video Call</h1>

//       <div className="grid grid-cols-2 gap-4 mb-4">
//         <div>
//           <video ref={localVideoRef} autoPlay playsInline muted className="w-full bg-black rounded" />
//           <p className="text-center mt-1">You</p>
//         </div>
//         <div>
//           <video ref={remoteVideoRef} autoPlay
//             playsInline
//             muted={false}
//             controls={false} className="w-full bg-black rounded" />
//           <p className="text-center mt-1">Remote</p>
//         </div>
//       </div>

//       <div className="flex gap-3 flex-wrap">
//         {role !== "caller" ? <button onClick={handleReceive} className="bg-green-600 text-white px-4 py-2 rounded">
//           Receive Call
//         </button> : null}
//         <button onClick={toggleMute} className="bg-yellow-500 text-white px-4 py-2 rounded">
//           Mute/Unmute
//         </button>
//         <button onClick={handleLeave} className="bg-red-600 text-white px-4 py-2 rounded">
//           Leave
//         </button>
//       </div>
//     </div>
//   );
// };

// export default GroupCall;


// import React, { useEffect, useRef, useState } from "react";
// import {
//   startMedia,
//   createCall,
//   hangUp,
//   toggleMute,
// } from "../utils/groupVideoCallUtils";

// // Sample props: current user and participants
// const GroupVideoCall = ({ callId, currentUserId, users }) => {
//   const localRef = useRef();
//   const remoteRefs = useRef({}); // Store remote video refs per user

//   const [isMuted, setIsMuted] = useState(false);

//   // Create dynamic refs for each user except self
//   useEffect(() => {
//     users.forEach((user) => {
//       if (user.id !== currentUserId) {
//         remoteRefs.current[user.id] = React.createRef();
//       }
//     });
//   }, [users, currentUserId]);

//   // Start media and auto join call
//   useEffect(() => {
//     const init = async () => {
//       try {
//         await startMedia(localRef);
//         await createCall(callId, remoteRefs.current, currentUserId);
//       } catch (err) {
//         console.error("🔥 Call Init Failed:", err);
//       }
//     };

//     init();

//     return () => {
//       hangUp(callId);
//     };
//   }, [callId, currentUserId]);

//   const handleMute = () => {
//     const muted = toggleMute();
//     setIsMuted(muted);
//   };

//   return (
//     <div>
//       <h2>🔗 Group Video Call (Room ID: {callId})</h2>

//       {/* Local Video */}
//       <div>
//         <p>🧍 You ({currentUserId})</p>
//         <video ref={localRef} autoPlay muted playsInline className="video-box" />
//       </div>

//       {/* Remote Videos */}
//       {users
//         .filter((u) => u.id !== currentUserId)
//         .map((user) => (
//           <div key={user.id}>
//             <p>👤 {user.name}</p>
//             <video
//               ref={remoteRefs.current[user.id]}
//               autoPlay
//               playsInline
//               className="video-box"
//             />
//           </div>
//         ))}

//       {/* Controls */}
//       <div style={{ marginTop: "1rem" }}>
//         <button onClick={handleMute}>{isMuted ? "🔇 Unmute" : "🎤 Mute"}</button>
//         <button onClick={() => hangUp(callId)}>❌ Hang Up</button>
//       </div>
//     </div>
//   );
// };

// export default GroupVideoCall;


// src/components/GroupCallUI.jsx
import React, { useRef, useEffect, useState } from "react";
import {
  startMedia,
  createCall,
  receiveCall,
  toggleMute,
  hangUp,
} from "../utils/groupVideoCallUtils";
import { useLocation, useNavigate } from "react-router-dom"

const GroupVideoCall = () => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [muted, setMuted] = useState(false);
  const [callReceived, setCallReceived] = useState(false);
  const { callId, role } = useLocation()?.state || {};
  const navigate = useNavigate();


  useEffect(() => {
    // Start media and auto-initiate call when component mounts
    const initCall = async () => {
      await startMedia(localVideoRef);
      if (role === "caller") {
        await createCall(callId, remoteVideoRef);
      }
    };
    initCall();
  }, [callId]);

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
    window.location.reload(); // or navigate away
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
        <button onClick={handleMuteToggle}>{muted ? "🎤 Unmute" : "🔇 Mute"}</button>
        <button onClick={handleHangUp}>❌ Hang Up</button>
      </div>
    </div>
  );
};

export default GroupVideoCall;
