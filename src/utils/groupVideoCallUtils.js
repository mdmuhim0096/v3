// src/utils/groupVideoCallUtils.js
import { database, ref, set, onValue, remove, push, onChildAdded } from "../firebase";

let peerConnections = {};
let localStream = null;

import socket from "../component/socket";


export const startMedia = async (videoRef) => {
  if (!localStream) {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  }
  if (videoRef) {
    videoRef.srcObject = localStream;
  }
};

// const createPeerConnection = (remoteRef, callId, peerId) => {
//   const pc = new RTCPeerConnection({
//     iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
//   });

//   localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

//   pc.ontrack = (event) => {
//   const [remoteStream] = event.streams;
//   console.log("📡 Remote stream received:", remoteStream);

//   if (!remoteStream) return;

//   const tryAttachVideo = () => {
//     const videoEl = remoteRef?.current;
//     if (videoEl) {
//       videoEl.srcObject = remoteStream;
//       const playPromise = videoEl.play();
//       if (playPromise !== undefined) {
//         playPromise.catch(err => {
//           console.warn("🔇 Autoplay blocked or failed:", err.message);
//         });
//       }
//     } else {
//       console.warn("❌ remoteRef.current is null. Retrying...");
//       setTimeout(tryAttachVideo, 300); // Retry after a short delay
//     }
//   };

//   tryAttachVideo(); // Run initially
// };

//   return pc;
// };


const createPeerConnection = (remoteRef, callId, peerId) => {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  // ✅ Add local tracks to connection
  localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

  // ✅ Handle remote media
  pc.ontrack = (event) => {
    const [remoteStream] = event.streams;
    console.log("📡 Remote stream received:", remoteStream);

    if (!remoteStream) return;

    const tryAttachVideo = () => {
      const videoEl = remoteRef?.current;
      if (videoEl) {
        videoEl.srcObject = remoteStream;
        const playPromise = videoEl.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.warn("🔇 Autoplay blocked or failed:", err.message);
          });
        }
      } else {
        console.warn("❌ remoteRef.current is null. Retrying...");
        setTimeout(tryAttachVideo, 300); // Retry after a short delay
      }
    };

    tryAttachVideo();
  };

  return pc;
};


export const createCall = async (callId, remoteVideoRef) => {
  const peerId = crypto.randomUUID();

  // ✅ FIX: Ensure localStream is available
  if (!localStream) {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  }

  const pc = createPeerConnection(remoteVideoRef, callId, peerId);
  peerConnections[peerId] = pc;

  socket.emit("join_room", callId);

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  const offerRef = ref(database, `calls/${callId}/offer`);
  await set(offerRef, {
    type: offer.type,
    sdp: offer.sdp,
  });

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

  // ✅ FIX: Ensure localStream is initialized
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

  await set(ref(database, `calls/${callId}/answer`), {
    type: answer.type,
    sdp: answer.sdp,
  });

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
