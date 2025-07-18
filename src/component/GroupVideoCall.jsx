// // src/components/GroupVideoCall.jsx
// import React, { useEffect, useRef, useState } from "react";
// import {
//     startMedia,
//     createCall,
//     receiveCall,
//     hangUp,
//     toggleMute,
//     listenForAnswers,
//     listenForCandidates
// } from "../utils/groupVideoCallUtils";

// import { useLocation, useNavigate } from "react-router-dom";

// const GroupVideoCall = () => {
//     const { roomId, userId, isCaller } = useLocation()?.state;
//     const localRef = useRef();
//     const [remoteStreams, setRemoteStreams] = useState({});
//     const [muted, setMuted] = useState(false);
//     const navigate = useNavigate();

//     useEffect(() => {
//         (async () => {
//             const stream = await startMedia();
//             if (localRef.current) {
//                 localRef.current.srcObject = stream;
//             }

//             if (isCaller) {
//                 await createCall(roomId, userId);
//                 listenForAnswers(roomId, userId);
//                 listenForCandidates(roomId, userId);
//             }
//         })();

//     }, []);

//     const handleReceive = async () => {
//         const callerSnapshot = await get(ref(database, `rooms/${roomId}/offers`));
//         if (callerSnapshot.exists()) {
//             const offerMap = callerSnapshot.val();
//             const callerId = Object.keys(offerMap)[0];

//             await receiveCall(roomId, callerId, userId, (stream, id) => {
//                 setRemoteStreams((prev) => ({ ...prev, [id]: stream }));
//             });

//             listenForCandidates(roomId, userId);
//         } else {
//             alert("No offer found");
//         }
//     };

//     const handleMute = () => {
//         const isNowMuted = toggleMute();
//         setMuted(isNowMuted);
//     };

//     function hangUpCall() {
//         hangUp(roomId);
//         navigate("/chatroom");
//         window.location.reload();
//     };

//     return (
//         <div>
//             <h2>Room: {roomId}</h2>
//             <div>
//                 <video ref={localRef} autoPlay muted playsInline style={{ width: 200 }} />
//                 {Object.entries(remoteStreams).map(([uid, stream]) => (
//                     <video
//                         key={uid}
//                         autoPlay
//                         playsInline
//                         srcObject={stream}
//                         style={{ width: 200 }}
//                         ref={el => {
//                             if (el) el.srcObject = stream;
//                         }}
//                     />
//                 ))}
//             </div>
//             {!isCaller && <button onClick={handleReceive}>📞 Receive Call</button>}
//             <button onClick={handleMute}>{muted ? "🔇 Unmute" : "🔊 Mute"}</button>
//             <button onClick={() => hangUpCall()}>❌ Hang Up</button>
//         </div>
//     );
// };

// export default GroupVideoCall;
// src/components/GroupVideoCall.jsx


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
    if (!roomId || !userId) {
      alert("Missing roomId or userId");
      navigate("/chatroom");
      return;
    }

    let isMounted = true;

    (async () => {
      try {
        const stream = await startMedia();
        if (localRef.current) {
          localRef.current.srcObject = stream;
        }

        if (isCaller) {
          await createCall(roomId, userId);
          listenForAnswers(roomId, userId);
          listenForCandidates(roomId, userId);
        }
      } catch (err) {
        console.error("Media init error:", err);
        alert("Could not access camera/mic.");
      }
    })();

  }, [roomId, userId, isCaller, navigate]);

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

