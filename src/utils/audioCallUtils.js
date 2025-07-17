// src/utils/audioCallUtils.js
import socket from "../component/socket";
import { database, ref, set, onValue, remove, push } from "../firebase";

let pc = null;
let existingStream = null;

export const startMedia = async (localAudioRef) => {
  try {
    if (!existingStream) {
      existingStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    }
    if (localAudioRef) {
      localAudioRef.srcObject = existingStream;
    }
    return { localStream: existingStream };
  } catch (err) {
    throw new Error("Could not access microphone");
  }
};

export const createPeerConnection = (localStream, remoteAudioRef, callId, role) => {
  pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

  pc.ontrack = event => {
    if (remoteAudioRef) remoteAudioRef.srcObject = event.streams[0];
  };

  pc.onicecandidate = event => {
    if (event.candidate) {
      const candidateRef = ref(database, `calls/${callId}/${role === "caller" ? "callerCandidates" : "calleeCandidates"}`);
      push(candidateRef, event.candidate.toJSON());
    }
  };
};

export const createCall = async (callId, userId, info, localStream, remoteAudioRef) => {
  createPeerConnection(localStream, remoteAudioRef, callId, "caller");
  socket.emit("incoming_call_a", { userId, callId, info });

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  await set(ref(database, `calls/${callId}`), {
    offer: {
      type: offer.type,
      sdp: offer.sdp,
    }
  });

  onValue(ref(database, `calls/${callId}/answer`), async snapshot => {
    const data = snapshot.val();
    if (data && !pc.currentRemoteDescription) {
      await pc.setRemoteDescription(new RTCSessionDescription(data));
    }
  });

  onValue(ref(database, `calls/${callId}/calleeCandidates`), snapshot => {
    snapshot.forEach(child => {
      const candidate = new RTCIceCandidate(child.val());
      pc.addIceCandidate(candidate);
    });
  });
};

export const joinCall = async (callId, localStream, remoteAudioRef) => {
  createPeerConnection(localStream, remoteAudioRef, callId, "callee");

  const snapshot = await new Promise(resolve => onValue(ref(database, `calls/${callId}`), resolve, { onlyOnce: true }));
  const data = snapshot.val();
  if (!data?.offer) return;

  await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  await set(ref(database, `calls/${callId}/answer`), {
    type: answer.type,
    sdp: answer.sdp,
  });

  onValue(ref(database, `calls/${callId}/callerCandidates`), snapshot => {
    snapshot.forEach(child => {
      const candidate = new RTCIceCandidate(child.val());
      pc.addIceCandidate(candidate);
    });
  });
};

export const hangUp = async (callId) => {
  if (pc) {
    pc.close();
    pc = null;
  }
  await remove(ref(database, `calls/${callId}`));
};

export const toggleMute = (localAudioRef) => {
  const track = localAudioRef?.srcObject?.getAudioTracks?.()[0];
  if (!track) return;
  track.enabled = !track.enabled;
  return !track.enabled;
};
