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
        await createCall(roomId, userId); // ✅ THIS was missing in your last message
        listenForAnswers(roomId, userId, (stream, id) => {
          setRemoteStreams((prev) => ({ ...prev, [id]: stream }));
        });
        listenForCandidates(roomId, userId);
      }
    } catch (err) {
      console.error("Call setup error:", err);
    }
  };

  setup();

  return () => {
    hangUp(roomId);
  };
}, []);



  const handleReceive = async () => {
    try {
      const callerSnapshot = await get(ref(database, `rooms/${roomId}/offers`));
      if (callerSnapshot.exists()) {
        const offerMap = callerSnapshot.val();
        const callerId = Object.keys(offerMap)[0]; // assuming first caller

        await receiveCall(roomId, callerId, userId, (stream, id) => {
          setRemoteStreams((prev) => ({ ...prev, [id]: stream }));
        });

        listenForCandidates(roomId, userId);
      } else {
        alert("No offer found in this room.");
      }
    } catch (error) {
      console.error("Receive error:", error);
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
    <div>
      <h2>Room: {roomId}</h2>

      <div>
        <video ref={localRef} autoPlay muted playsInline style={{ width: 200 }} />

        {Object.entries(remoteStreams).map(([uid, stream]) => (
          <video
            key={uid}
            autoPlay
            playsInline
            style={{ width: 200 }}
            ref={(el) => {
              if (el) el.srcObject = stream;
            }}
          />
        ))}
      </div>

      {!isCaller && <button onClick={handleReceive}>📞 Receive Call</button>}
      <button onClick={handleMute}>{muted ? "🔇 Unmute" : "🔊 Mute"}</button>
      <button onClick={hangUpCall}>❌ Hang Up</button>
    </div>
  );
};

export default GroupVideoCall;


// src/components/GroupVideoCall.jsx
// import React, { useEffect, useRef, useState } from "react";
// import {
//   startMedia,
//   createCall,
//   receiveCall,
//   hangUp,
//   toggleMute,
//   listenForAnswers,
//   listenForCandidates,
// } from "../utils/groupVideoCallUtils";

// import { useLocation, useNavigate } from "react-router-dom";
// import { get, ref } from "firebase/database";
// import { database } from "../firebase";

// const GroupVideoCall = () => {
//   const { roomId, userId, isCaller } = useLocation()?.state || {};
//   const navigate = useNavigate();

//   const localRef = useRef(null);
//   const [remoteStreams, setRemoteStreams] = useState({});
//   const [muted, setMuted] = useState(false);

//   useEffect(() => {
//     const setup = async () => {
//       try {
//         const stream = await startMedia();
//         if (localRef.current) {
//           localRef.current.srcObject = stream;
//         }

//         if (isCaller) {
//           await createCall(roomId, userId);
//           listenForAnswers(roomId, userId, (stream, id) => {
//             setRemoteStreams((prev) => ({ ...prev, [id]: stream }));
//           });
//           listenForCandidates(roomId, userId);
//         }
//       } catch (err) {
//         console.error("Call setup error:", err);
//       }
//     };

//     setup();

//     return () => {
//       hangUp(roomId);
//     };
//   }, []);

//   const handleReceive = async () => {
//     try {
//       const callerSnapshot = await get(ref(database, `rooms/${roomId}/offers`));
//       if (callerSnapshot.exists()) {
//         const offerMap = callerSnapshot.val();
//         const callerId = Object.keys(offerMap)[0]; // use first

//         await receiveCall(roomId, callerId, userId, (stream, id) => {
//           setRemoteStreams((prev) => ({ ...prev, [id]: stream }));
//         });

//         listenForCandidates(roomId, userId);
//       } else {
//         alert("No offer found in this room.");
//       }
//     } catch (error) {
//       console.error("Receive error:", error);
//     }
//   };

//   const handleMute = () => {
//     const isNowMuted = toggleMute();
//     setMuted(isNowMuted);
//   };

//   const hangUpCall = () => {
//     hangUp(roomId);
//     navigate("/chatroom");
//     window.location.reload();
//   };

//   return (
//     <div>
//       <h2>Room: {roomId}</h2>

//       <div>
//         <video ref={localRef} autoPlay muted playsInline style={{ width: 200 }} />

//         {Object.entries(remoteStreams).map(([uid, stream]) => (
//           <VideoTile key={uid} stream={stream} />
//         ))}
//       </div>

//       {!isCaller && <button onClick={handleReceive}>📞 Receive Call</button>}
//       <button onClick={handleMute}>{muted ? "🔇 Unmute" : "🔊 Mute"}</button>
//       <button onClick={hangUpCall}>❌ Hang Up</button>
//     </div>
//   );
// };

// const VideoTile = ({ stream }) => {
//   const videoRef = useRef(null);

//   useEffect(() => {
//     if (videoRef.current && stream) {
//       videoRef.current.srcObject = stream;
//     }
//   }, [stream]);

//   return (
//     <video
//       ref={videoRef}
//       autoPlay
//       playsInline
//       style={{ width: 200 }}
//     />
//   );
// };

// export default GroupVideoCall;
