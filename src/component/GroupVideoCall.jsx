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


// ✅ src/components/GroupCall.jsx
// import React, { useEffect, useRef, useState } from "react";
// import {
//   startMedia,
//   createCall,
//   receiveCall,
//   toggleMute,
//   hangUp
// } from "../utils/groupVideoCallUtils";
// import { useLocation, useNavigate } from "react-router-dom";

// const GroupCall = () => {
//   const localVideoRef = useRef(null);
//   const remoteVideoRef = useRef(null);
//   const [joined, setJoined] = useState(false);
//   const navigate = useNavigate();

//   // ✅ safely access route state
//   const { callId, role } = useLocation()?.state || {};

//   // ✅ validate callId exists before doing anything
//   useEffect(() => {
//     if (!callId) {
//       alert("❌ No callId provided.");
//       navigate("/chatroom");
//       return;
//     }

//     // ✅ start media first
//     const media = async () => {
//       try {
//         await startMedia(localVideoRef.current);
//       } catch (err) {
//         console.error("Failed to access media:", err);
//         alert("Failed to access camera or microphone.");
//       }
//     };

//     media();
//   }, [callId, navigate]);

//   // ✅ create call if role is caller
//   useEffect(() => {
//     const handleCreate = async () => {
//       try {
//         await createCall(callId, remoteVideoRef);
//         setJoined(true);
//       } catch (err) {
//         console.error("Error creating call:", err);
//       }
//     };

//     if (role === "caller" && callId) {
//       handleCreate();
//     }
//   }, [role, callId]);

//   // ✅ receive call handler
//   const handleReceive = async () => {
//     try {
//       await receiveCall(callId, remoteVideoRef);
//       setJoined(true);
//     } catch (err) {
//       console.error("Error receiving call:", err);
//     }
//   };

//   // ✅ leave call
//   const handleLeave = async () => {
//     await hangUp(callId);
//     setJoined(false);
//     navigate("/chatroom");
//     window.location.reload(); // ❗️only if needed
//   };

//   return (
//     <div className="p-4">
//       <h1 className="text-xl font-bold mb-4">Simple Video Call</h1>

//       <div className="grid grid-cols-2 gap-4 mb-4">
//         <div>
//           <video
//             ref={localVideoRef}
//             autoPlay
//             playsInline
//             muted
//             className="w-full bg-black rounded"
//           />
//           <p className="text-center mt-1">You</p>
//         </div>
//         <div>
//           <video
//             ref={remoteVideoRef}
//             autoPlay
//             playsInline
//             className="w-full bg-black rounded"
//           />
//           <p className="text-center mt-1">Remote</p>
//         </div>
//       </div>

//       <div className="flex gap-3 flex-wrap">
//         {role !== "caller" && !joined && (
//           <button
//             onClick={handleReceive}
//             className="bg-green-600 text-white px-4 py-2 rounded"
//           >
//             Receive Call
//           </button>
//         )}
//         <button
//           onClick={toggleMute}
//           className="bg-yellow-500 text-white px-4 py-2 rounded"
//         >
//           Mute/Unmute
//         </button>
//         <button
//           onClick={handleLeave}
//           className="bg-red-600 text-white px-4 py-2 rounded"
//         >
//           Leave
//         </button>
//       </div>
//     </div>
//   );
// };

// export default GroupCall;
