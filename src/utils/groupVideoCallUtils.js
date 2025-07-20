// // src/utils/groupVideoCallUtils.js
// import { database, ref, set, onValue, remove, push, onChildAdded } from "../firebase";

// let peerConnections = {};
// let localStream = null;

// import socket from "../component/socket";


// export const startMedia = async (videoRef) => {
//   if (!localStream) {
//     localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
//   }
//   if (videoRef) {
//     videoRef.srcObject = localStream;
//   }
// };


// const createPeerConnection = (remoteRef, callId, peerId) => {
//   const pc = new RTCPeerConnection({
//     iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
//   });

//   // ✅ Attach local stream tracks
//   if (localStream) {
//     localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
//   } else {
//     console.warn("⚠️ localStream is null when trying to add tracks.");
//   }

//   // ✅ Handle remote stream
//   pc.ontrack = (event) => {
//     const [remoteStream] = event.streams;
//     console.log("📡 Remote stream received:", remoteStream);

//     if (!remoteStream) return;

//     const attachRemoteStream = () => {
//       const videoEl = remoteRef?.current;

//       if (!videoEl) {
//         console.warn("❌ remoteRef.current is null. Will retry...");
//         setTimeout(attachRemoteStream, 200); // Retry until video is available
//         return;
//       }

//       // Force load new stream
//       videoEl.srcObject = null;
//       videoEl.srcObject = remoteStream;

//       const play = () => {
//         videoEl
//           .play()
//           .then(() => console.log("▶️ Remote video playing"))
//           .catch((err) => {
//             console.warn("🔇 play() failed, trying muted workaround:", err.message);
//             videoEl.muted = true;
//             videoEl
//               .play()
//               .then(() => console.log("▶️ Remote video playing with muted workaround"))
//               .catch((err) => console.warn("❌ Still can't play:", err.message));
//           });
//       };

//       // Try playing after forcing srcObject change
//       setTimeout(play, 100);
//     };

//     attachRemoteStream();
//   };

//   return pc;
// };

// ///



// ///

// export const createCall = async (callId, remoteVideoRef) => {
//   const peerId = crypto.randomUUID();

//   // ✅ FIX: Ensure localStream is available
//   if (!localStream) {
//     localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
//   }

//   const pc = createPeerConnection(remoteVideoRef, callId, peerId);
//   peerConnections[peerId] = pc;

//   socket.emit("join_room", callId);

//   const offer = await pc.createOffer();
//   await pc.setLocalDescription(offer);

//   const offerRef = ref(database, `calls/${callId}/offer`);
//   await set(offerRef, {
//     type: offer.type,
//     sdp: offer.sdp,
//   });

//   onValue(ref(database, `calls/${callId}/answer`), async (snapshot) => {
//     const data = snapshot.val();
//     if (data && !pc.currentRemoteDescription) {
//       await pc.setRemoteDescription(new RTCSessionDescription(data));
//     }
//   });

//   onChildAdded(ref(database, `calls/${callId}/candidates/receiver`), async (snapshot) => {
//     const candidate = new RTCIceCandidate(snapshot.val());
//     await pc.addIceCandidate(candidate);
//   });
// };


// export const receiveCall = async (callId, remoteVideoRef) => {
//   const peerId = "receiver";

//   // ✅ FIX: Ensure localStream is initialized
//   if (!localStream) {
//     localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
//   }

//   const offerSnap = await new Promise((resolve) => {
//     onValue(ref(database, `calls/${callId}/offer`), resolve, { onlyOnce: true });
//   });

//   const offerData = offerSnap.val();
//   if (!offerData) return;

//   const pc = createPeerConnection(remoteVideoRef, callId, peerId);
//   peerConnections[peerId] = pc;

//   await pc.setRemoteDescription(new RTCSessionDescription(offerData));
//   const answer = await pc.createAnswer();
//   await pc.setLocalDescription(answer);

//   await set(ref(database, `calls/${callId}/answer`), {
//     type: answer.type,
//     sdp: answer.sdp,
//   });

//   onChildAdded(ref(database, `calls/${callId}/candidates/${peerId}`), async (snapshot) => {
//     const candidate = new RTCIceCandidate(snapshot.val());
//     await pc.addIceCandidate(candidate);
//   });
// };

// export const toggleMute = () => {
//   if (!localStream) return;
//   const audioTrack = localStream.getAudioTracks()[0];
//   if (audioTrack) {
//     audioTrack.enabled = !audioTrack.enabled;
//     return !audioTrack.enabled;
//   }
// };

// export const hangUp = async (callId) => {
//   Object.values(peerConnections).forEach((pc) => pc.close());
//   peerConnections = {};
//   await remove(ref(database, `calls/${callId}`));
// };



// import { database, ref, set, onValue, remove, push, onChildAdded } from "../firebase";

// let peerConnections = {};
// let localStream = null;
// let userId = crypto.randomUUID(); // Unique ID for each participant
// import socket from "../component/socket";

// export const startMedia = async (videoRef) => {
//   if (!localStream) {
//     localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
//   }
//   if (videoRef) {
//     videoRef.srcObject = localStream;
//   }
// };

// const createPeerConnection = (remoteRef, callId, remoteId) => {
//   const pc = new RTCPeerConnection({
//     iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
//   });

//   // Add local stream
//   if (localStream) {
//     localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
//   }

//   // Handle remote stream
//   pc.ontrack = (event) => {
//     const [remoteStream] = event.streams;
//     if (!remoteStream) return;

//     const attachStream = () => {
//       const videoEl = remoteRef?.current;
//       if (!videoEl) return setTimeout(attachStream, 200);
//       videoEl.srcObject = remoteStream;
//       videoEl.play().catch(() => {
//         videoEl.muted = true;
//         videoEl.play().catch(() => {});
//       });
//     };

//     attachStream();
//   };

//   // Send ICE candidates
//   pc.onicecandidate = (event) => {
//     if (event.candidate) {
//       const candidateRef = ref(database, `calls/${callId}/candidates/${userId}`);
//       push(candidateRef, event.candidate.toJSON());
//     }
//   };

//   return pc;
// };

// export const createCall = async (callId, remoteRefs = {}) => {
//   if (!localStream) {
//     localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
//   }

//   socket.emit("join_room", callId);
//   // Listen for other offers
//   onChildAdded(ref(database, `calls/${callId}/offers`), async (snapshot) => {
//     const remoteId = snapshot.key;
//     if (remoteId === userId || peerConnections[remoteId]) return;

//     const offerData = snapshot.val();
//     const pc = createPeerConnection(remoteRefs[remoteId], callId, remoteId);
//     peerConnections[remoteId] = pc;

//     await pc.setRemoteDescription(new RTCSessionDescription(offerData));
//     const answer = await pc.createAnswer();
//     await pc.setLocalDescription(answer);

//     await set(ref(database, `calls/${callId}/answers/${userId}/${remoteId}`), {
//       type: answer.type,
//       sdp: answer.sdp,
//     });

//     onChildAdded(ref(database, `calls/${callId}/candidates/${remoteId}`), async (snap) => {
//       const candidate = new RTCIceCandidate(snap.val());
//       await pc.addIceCandidate(candidate);
//     });
//   });

//   // Broadcast your offer to all
//   const pc = createPeerConnection(remoteRefs["group"], callId, "group");
//   peerConnections["group"] = pc;

//   const offer = await pc.createOffer();
//   await pc.setLocalDescription(offer);

//   await set(ref(database, `calls/${callId}/offers/${userId}`), {
//     type: offer.type,
//     sdp: offer.sdp,
//   });

//   // Listen for answers to your offer
//   onChildAdded(ref(database, `calls/${callId}/answers/${userId}`), async (snap) => {
//     const answerData = snap.val();
//     if (!peerConnections[snap.key]) return;
//     await peerConnections[snap.key].setRemoteDescription(new RTCSessionDescription(answerData));
//   });

//   // Add remote candidates
//   onChildAdded(ref(database, `calls/${callId}/candidates/${userId}`), async (snap) => {
//     const candidate = new RTCIceCandidate(snap.val());
//     await pc.addIceCandidate(candidate);
//   });
// };

// export const receiveCall = async (callId, remoteRefs = {}) => {
//   if (!localStream) {
//     localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
//   }

//   onChildAdded(ref(database, `calls/${callId}/offers`), async (snap) => {
//     const remoteId = snap.key;
//     if (remoteId === userId || peerConnections[remoteId]) return;

//     const offerData = snap.val();
//     const pc = createPeerConnection(remoteRefs[remoteId], callId, remoteId);
//     peerConnections[remoteId] = pc;

//     await pc.setRemoteDescription(new RTCSessionDescription(offerData));
//     const answer = await pc.createAnswer();
//     await pc.setLocalDescription(answer);

//     await set(ref(database, `calls/${callId}/answers/${remoteId}/${userId}`), {
//       type: answer.type,
//       sdp: answer.sdp,
//     });

//     onChildAdded(ref(database, `calls/${callId}/candidates/${remoteId}`), async (cSnap) => {
//       const candidate = new RTCIceCandidate(cSnap.val());
//       await pc.addIceCandidate(candidate);
//     });
//   });

//   // Accept ICE candidates sent to you
//   onChildAdded(ref(database, `calls/${callId}/candidates/${userId}`), async (snap) => {
//     const candidate = new RTCIceCandidate(snap.val());
//     for (const pc of Object.values(peerConnections)) {
//       await pc.addIceCandidate(candidate);
//     }
//   });
// };

// export const toggleMute = () => {
//   if (!localStream) return;
//   const audioTrack = localStream.getAudioTracks()[0];
//   if (audioTrack) {
//     audioTrack.enabled = !audioTrack.enabled;
//     return !audioTrack.enabled;
//   }
// };

// export const hangUp = async (callId) => {
//   Object.values(peerConnections).forEach((pc) => pc.close());
//   peerConnections = {};
//   await remove(ref(database, `calls/${callId}`));
// };

// src/utils/groupVideoCallUtils.js


import { database, ref, set, onValue, remove, push, onChildAdded } from "../firebase";
import socket from "../component/socket";

let peerConnections = {};
let localStream = null;

export const startMedia = async (videoRef) => {
  if (!localStream) {
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch (err) {
      console.error("🚫 Media access error:", err);
      return;
    }
  }

  if (videoRef?.current) {
    videoRef.current.srcObject = localStream;
    videoRef.current.muted = true; // ✅ Mute local stream
    videoRef.current.autoplay = true;
    videoRef.current.playsInline = true;

    // ✅ Safe play
    videoRef.current
      .play()
      .then(() => console.log("▶️ Local video playing"))
      .catch((err) => console.warn("🔇 Couldn't play local video:", err.message));
  }
};

const createPeerConnection = (remoteRef, callId, peerId) => {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  if (localStream) {
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
  }

  pc.ontrack = (event) => {
    const [remoteStream] = event.streams;
    const attachRemoteStream = () => {
      const videoEl = remoteRef?.current;
      if (!videoEl) return setTimeout(attachRemoteStream, 200);
      videoEl.srcObject = remoteStream;
      videoEl.play().catch(() => {
        videoEl.muted = true;
        videoEl.play();
      });
    };
    attachRemoteStream();
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      const candidateRef = ref(database, `calls/${callId}/candidates/${peerId}`);
      push(candidateRef, event.candidate.toJSON());
    }
  };

  return pc;
};

export const createCall = async (callId, remoteVideoRef) => {
  const peerId = crypto.randomUUID();

  if (!localStream) {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  }

  const pc = createPeerConnection(remoteVideoRef, callId, peerId);
  peerConnections[peerId] = pc;

  socket.emit("join_room", callId);

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  await set(ref(database, `calls/${callId}/offer`), offer);

  onValue(ref(database, `calls/${callId}/answer`), async (snapshot) => {
    const data = snapshot.val();
    if (data && !pc.currentRemoteDescription) {
      await pc.setRemoteDescription(new RTCSessionDescription(data));
    }
  });

  onChildAdded(ref(database, `calls/${callId}/candidates/receiver`), async (snapshot) => {
    const candidate = new RTCIceCandidate(snapshot.val());
    await pc.addIceCandidate(candidate);
  });
};

export const receiveCall = async (callId, remoteVideoRef) => {
  const peerId = "receiver";
  if (!localStream) {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  }

  const offerSnap = await new Promise((resolve) => {
    onValue(ref(database, `calls/${callId}/offer`), resolve, { onlyOnce: true });
  });

  const offerData = offerSnap.val();
  if (!offerData) return;

  const pc = createPeerConnection(remoteVideoRef, callId, peerId);
  peerConnections[peerId] = pc;

  await pc.setRemoteDescription(new RTCSessionDescription(offerData));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  await set(ref(database, `calls/${callId}/answer`), answer);

  onChildAdded(ref(database, `calls/${callId}/candidates/${peerId}`), async (snapshot) => {
    const candidate = new RTCIceCandidate(snapshot.val());
    await pc.addIceCandidate(candidate);
  });
};

export const toggleMute = () => {
  if (!localStream) return;
  const audioTrack = localStream.getAudioTracks()[0];
  if (audioTrack) {
    audioTrack.enabled = !audioTrack.enabled;
    return !audioTrack.enabled;
  }
};

export const hangUp = async (callId) => {
  Object.values(peerConnections).forEach((pc) => pc.close());
  peerConnections = {};
  await remove(ref(database, `calls/${callId}`));
};

