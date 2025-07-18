// // src/utils/groupVideoCallUtils.js
// import socket from "../component/socket";
// import { database } from "../firebase";
// import {
//     ref,
//     set,
//     push,
//     onChildAdded,
//     onChildRemoved,
//     remove,
//     get
// } from "firebase/database";


// let localStream;
// const peerConnections = {};
// const config = {
//   iceServers: [
//     { urls: "stun:stun.l.google.com:19302" },
//     {
//       urls: "turn:relay1.expressturn.com:3478",
//       username: "efresh",
//       credential: "webrtcdemo",
//     },
//   ],
// };


// export const startMedia = async () => {
//     localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
//     return localStream;
// };

// export const createCall = async (roomId, userId) => {
//     const offerRef = ref(database, `rooms/${roomId}/offers/${userId}`);
//     const pc = new RTCPeerConnection(config);
//     peerConnections[userId] = pc;
//     socket.emit("join_room", { roomId, userId });
//     localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

//     const offer = await pc.createOffer();
//     await pc.setLocalDescription(offer);

//     await set(offerRef, {
//         sdp: offer.sdp,
//         type: offer.type,
//         from: userId
//     });

//     pc.onicecandidate = (event) => {
//         if (event.candidate) {
//             const candidateRef = push(ref(database, `rooms/${roomId}/candidates/${userId}`));
//             set(candidateRef, event.candidate.toJSON());
//         }
//     };
// };


// export const receiveCall = async (roomId, callerId, receiverId, onTrack) => {
//     const offerRef = ref(database, `rooms/${roomId}/offers/${callerId}`);
//     const snapshot = await get(offerRef);

//     if (!snapshot.exists()) throw new Error("❌ No offer found");

//     const offerData = snapshot.val();
//     if (!offerData?.sdp || !offerData?.type) {
//         throw new Error("❌ Invalid offer format");
//     }

//     // ✅ Create peer connection
//     const pc = new RTCPeerConnection(config);
//     peerConnections[callerId] = pc;

//     // ✅ Add receiver's camera/mic to peer connection
//     localStream.getTracks().forEach(track => {
//         pc.addTrack(track, localStream); // <== THIS is required
//     });

//     // ✅ Handle remote stream (from caller)
//     pc.ontrack = (event) => {
//         onTrack(event.streams[0], callerId);
//     };

//     // ✅ Set remote description from caller (the offer)
//     await pc.setRemoteDescription(new RTCSessionDescription({
//         sdp: offerData.sdp,
//         type: offerData.type
//     }));

//     // ✅ Create and send back answer
//     const answer = await pc.createAnswer();
//     await pc.setLocalDescription(answer);

//     const answerRef = ref(database, `rooms/${roomId}/answers/${receiverId}`);
//     await set(answerRef, {
//         sdp: answer.sdp,
//         type: answer.type,
//         to: callerId
//     });

//     // ✅ Send receiver's ICE candidates
//     pc.onicecandidate = (event) => {
//         if (event.candidate) {
//             const candidateRef = push(ref(database, `rooms/${roomId}/candidates/${receiverId}`));
//             set(candidateRef, event.candidate.toJSON());
//         }
//     };
// };

// export const listenForAnswers = (roomId, callerId, onTrack) => {
//   const answerRef = ref(database, `rooms/${roomId}/answers`);
//   onChildAdded(answerRef, async (snapshot) => {
//     const answer = snapshot.val();
//     const receiverId = snapshot.key;

//     if (!answer || answer.to !== callerId) return;

//     console.log("📞 Received answer from:", receiverId);

//     let pc = peerConnections[callerId]; // ✅ Reuse caller's PC

//     if (!pc) {
//       pc = new RTCPeerConnection(config);
//       peerConnections[callerId] = pc;

//       localStream.getTracks().forEach(track => {
//         pc.addTrack(track, localStream);
//       });

//       pc.onicecandidate = (event) => {
//         if (event.candidate) {
//           const candidateRef = push(ref(database, `rooms/${roomId}/candidates/${callerId}`));
//           set(candidateRef, event.candidate.toJSON());
//         }
//       };
//     }

//     pc.ontrack = (event) => {
//       console.log("📹 Caller received stream from:", receiverId);
//       onTrack(event.streams[0], receiverId);
//     };

//     await pc.setRemoteDescription(new RTCSessionDescription({
//       sdp: answer.sdp,
//       type: answer.type
//     }));
//   });
// };

// export const listenForCandidates = (roomId, userId) => {
//     const candidateRef = ref(database, `rooms/${roomId}/candidates`);
//     onChildAdded(candidateRef, async (snapshot) => {
//         const candidate = snapshot.val();
//         const to = candidate?.to;

//         // Skip if not meant for this user
//         if (to && to !== userId) return;

//         const pc = peerConnections[userId];
//         if (pc) {
//             try {
//                 await pc.addIceCandidate(new RTCIceCandidate(candidate));
//             } catch (err) {
//                 console.error("Error adding ICE candidate", err);
//             }
//         }
//     });
// };

// export const hangUp = async (roomId) => {
//     Object.values(peerConnections).forEach(pc => pc.close());
//     await remove(ref(database, `rooms/${roomId}`));
// };

// export const toggleMute = () => {
//     if (localStream) {
//         const audioTrack = localStream.getAudioTracks()[0];
//         audioTrack.enabled = !audioTrack.enabled;
//         return !audioTrack.enabled;
//     }
// };



// src/utils/groupVideoCallUtils.js


// import socket from "../component/socket";
// import { database } from "../firebase";
// import {
//   ref,
//   set,
//   push,
//   onChildAdded,
//   remove,
//   get,
// } from "firebase/database";

// let localStream;
// const peerConnections = {};
// const config = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

// export const startMedia = async () => {
//   localStream = await navigator.mediaDevices.getUserMedia({
//     video: true,
//     audio: true,
//   });
//   return localStream;
// };

// export const createCall = async (roomId, userId) => {
//   const offerRef = ref(database, `rooms/${roomId}/offers/${userId}`);
//   const pc = new RTCPeerConnection(config);
//   peerConnections[userId] = pc;

//   socket.emit("join_room", { roomId, userId });

//   localStream.getTracks().forEach((track) =>
//     pc.addTrack(track, localStream)
//   );

//   const offer = await pc.createOffer();
//   await pc.setLocalDescription(offer);

//   await set(offerRef, {
//     sdp: offer.sdp,
//     type: offer.type,
//     from: userId,
//   });

//   pc.onicecandidate = (event) => {
//     if (event.candidate) {
//       const candidateRef = push(
//         ref(database, `rooms/${roomId}/candidates/${userId}`)
//       );
//       set(candidateRef, event.candidate.toJSON());
//     }
//   };
// };

// export const receiveCall = async (roomId, callerId, receiverId, onTrack) => {
//   const offerRef = ref(database, `rooms/${roomId}/offers/${callerId}`);
//   const snapshot = await get(offerRef);

//   if (!snapshot.exists()) throw new Error("❌ No offer found");

//   const offerData = snapshot.val();

//   const pc = new RTCPeerConnection(config);
//   peerConnections[callerId] = pc;

//   localStream.getTracks().forEach((track) =>
//     pc.addTrack(track, localStream)
//   );

//   pc.ontrack = (event) => {
//     onTrack(event.streams[0], callerId);
//   };

//   await pc.setRemoteDescription(
//     new RTCSessionDescription({
//       sdp: offerData.sdp,
//       type: offerData.type,
//     })
//   );

//   const answer = await pc.createAnswer();
//   await pc.setLocalDescription(answer);

//   const answerRef = ref(database, `rooms/${roomId}/answers/${receiverId}`);
//   await set(answerRef, {
//     sdp: answer.sdp,
//     type: answer.type,
//     to: callerId,
//   });

//   pc.onicecandidate = (event) => {
//     if (event.candidate) {
//       const candidateRef = push(
//         ref(database, `rooms/${roomId}/candidates/${receiverId}`)
//       );
//       set(candidateRef, event.candidate.toJSON());
//     }
//   };
// };

// export const listenForAnswers = (roomId, callerId, onTrack) => {
//   const answerRef = ref(database, `rooms/${roomId}/answers`);
//   onChildAdded(answerRef, async (snapshot) => {
//     const answer = snapshot.val();
//     const receiverId = snapshot.key;

//     if (!answer || answer.to !== callerId) return;

//     const pc = new RTCPeerConnection(config);
//     peerConnections[receiverId] = pc;

//     localStream.getTracks().forEach((track) =>
//       pc.addTrack(track, localStream)
//     );

//     pc.onicecandidate = (event) => {
//       if (event.candidate) {
//         const candidateRef = push(
//           ref(database, `rooms/${roomId}/candidates/${callerId}`)
//         );
//         set(candidateRef, event.candidate.toJSON());
//       }
//     };

//     pc.ontrack = (event) => {
//       console.log("📹 Caller received stream from:", receiverId);
//       onTrack(event.streams[0], receiverId);
//     };

//     await pc.setRemoteDescription(
//       new RTCSessionDescription({
//         sdp: answer.sdp,
//         type: answer.type,
//       })
//     );
//   });
// };

// export const listenForCandidates = (roomId, userId) => {
//   const candidateRef = ref(database, `rooms/${roomId}/candidates`);
//   onChildAdded(candidateRef, async (snapshot) => {
//     const candidate = snapshot.val();
//     const to = candidate?.to;

//     if (to && to !== userId) return;

//     const pc = peerConnections[userId] || peerConnections[candidate?.from];
//     if (pc) {
//       try {
//         await pc.addIceCandidate(new RTCIceCandidate(candidate));
//       } catch (err) {
//         console.error("Error adding ICE candidate", err);
//       }
//     }
//   });
// };

// export const hangUp = async (roomId) => {
//   Object.values(peerConnections).forEach((pc) => pc.close());
//   await remove(ref(database, `rooms/${roomId}`));
// };

// export const toggleMute = () => {
//   if (localStream) {
//     const audioTrack = localStream.getAudioTracks()[0];
//     audioTrack.enabled = !audioTrack.enabled;
//     return !audioTrack.enabled;
//   }
// };
// ✅ groupVideoCallUtils.js (Final working version);

import socket from "../component/socket";
import { database } from "../firebase";
import {
  ref,
  set,
  push,
  onChildAdded,
  remove,
  get,
} from "firebase/database";

let localStream;
const peerConnections = {};

const config = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    {
      urls: "turn:relay.metered.ca:80",
      username: "openai",
      credential: "openai"
    },
    {
      urls: "turn:relay.metered.ca:443",
      username: "openai",
      credential: "openai"
    },
    {
      urls: "turn:relay.metered.ca:443?transport=tcp",
      username: "openai",
      credential: "openai"
    }
  ]
};

export const startMedia = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  return localStream;
};

export const createCall = async (roomId, userId) => {
  const offerRef = ref(database, `rooms/${roomId}/offers/${userId}`);
  const pc = new RTCPeerConnection(config);
  peerConnections[userId] = pc;

  socket.emit("join_room", { roomId, userId });

  localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  await set(offerRef, {
    sdp: offer.sdp,
    type: offer.type,
    from: userId,
  });

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      const candidateRef = push(ref(database, `rooms/${roomId}/candidates/${userId}`));
      set(candidateRef, { ...event.candidate.toJSON(), from: userId });
    }
  };
};

export const receiveCall = async (roomId, callerId, receiverId, onTrack) => {
  const offerRef = ref(database, `rooms/${roomId}/offers/${callerId}`);
  const snapshot = await get(offerRef);
  if (!snapshot.exists()) throw new Error("❌ No offer found");
  const offerData = snapshot.val();

  const pc = new RTCPeerConnection(config);
  peerConnections[callerId] = pc;

  localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

  pc.ontrack = (event) => {
    console.log("📹 Receiver got stream:", event.streams);
    onTrack(event.streams[0], callerId);
  };

  await pc.setRemoteDescription(new RTCSessionDescription({ sdp: offerData.sdp, type: offerData.type }));

  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  const answerRef = ref(database, `rooms/${roomId}/answers/${receiverId}`);
  await set(answerRef, { sdp: answer.sdp, type: answer.type, to: callerId });

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      const candidateRef = push(ref(database, `rooms/${roomId}/candidates/${receiverId}`));
      set(candidateRef, { ...event.candidate.toJSON(), from: receiverId });
    }
  };
};

export const listenForAnswers = (roomId, callerId, onTrack) => {
  const answerRef = ref(database, `rooms/${roomId}/answers`);
  onChildAdded(answerRef, async (snapshot) => {
    const answer = snapshot.val();
    const receiverId = snapshot.key;
    if (!answer || answer.to !== callerId) return;

    const pc = peerConnections[callerId];
    if (!pc) return console.warn("❌ No PC for", callerId);

    pc.ontrack = (event) => {
      console.log("📹 Caller got stream:", event.streams);
      onTrack(event.streams[0], receiverId);
    };

    await pc.setRemoteDescription(new RTCSessionDescription({ sdp: answer.sdp, type: answer.type }));
  });
};

export const listenForCandidates = (roomId, userId) => {
  const candidateRef = ref(database, `rooms/${roomId}/candidates`);
  onChildAdded(candidateRef, async (snapshot) => {
    const candidate = snapshot.val();
    const pc = peerConnections[userId] || peerConnections[candidate?.from] || peerConnections[candidate?.to];
    if (pc) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("Error adding ICE candidate", err);
      }
    }
  });
};

export const hangUp = async (roomId) => {
  Object.values(peerConnections).forEach((pc) => pc.close());
  await remove(ref(database, `rooms/${roomId}`));
};

export const toggleMute = () => {
  if (localStream) {
    const audioTrack = localStream.getAudioTracks()[0];
    audioTrack.enabled = !audioTrack.enabled;
    return !audioTrack.enabled;
  }
};

