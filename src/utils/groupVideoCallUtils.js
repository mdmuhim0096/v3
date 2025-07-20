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

const createPeerConnection = (remoteRef, callId, peerId) => {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

  pc.ontrack = (event) => {
    if (remoteRef?.current) {
      remoteRef.current.srcObject = event.streams[0];
    }
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      const candidateRef = ref(database, `calls/${callId}/candidates/${peerId}`);
      push(candidateRef, event.candidate.toJSON());
    }
  };

  return pc;
};

// export const createCall = async (callId, remoteVideoRef) => {
//   const peerId = crypto.randomUUID();
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
