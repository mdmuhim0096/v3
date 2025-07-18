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
      credential: "openai",
    },
    {
      urls: "turn:relay.metered.ca:443",
      username: "openai",
      credential: "openai",
    },
    {
      urls: "turn:relay.metered.ca:443?transport=tcp",
      username: "openai",
      credential: "openai",
    },
  ],
};

export const startMedia = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  return localStream;
};

export const createCall = async (roomId, callerId, targetUserId) => {
  const pc = new RTCPeerConnection(config);
  peerConnections[targetUserId] = pc;
  console.log("Creating call for:", targetUserId);
  socket.emit("join_room", { roomId, userId: callerId });

  localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  const offerRef = ref(database, `rooms/${roomId}/offers/${targetUserId}`);
  await set(offerRef, {
    sdp: offer.sdp,
    type: offer.type,
    from: callerId,
  });

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      const candidateRef = push(ref(database, `rooms/${roomId}/candidates/${callerId}`));
      set(candidateRef, { ...event.candidate.toJSON(), from: callerId, to: targetUserId });
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
    onTrack(event.streams[0], callerId);
  };

  await pc.setRemoteDescription(new RTCSessionDescription({ sdp: offerData.sdp, type: offerData.type }));

  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  const answerRef = ref(database, `rooms/${roomId}/answers/${receiverId}_${callerId}`);
  await set(answerRef, { sdp: answer.sdp, type: answer.type, to: callerId, from: receiverId });

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      const candidateRef = push(ref(database, `rooms/${roomId}/candidates/${receiverId}`));
      set(candidateRef, { ...event.candidate.toJSON(), from: receiverId, to: callerId });
    }
  };
};

export const listenForAnswers = (roomId, callerId, onTrack) => {
  const answerRef = ref(database, `rooms/${roomId}/answers`);
  onChildAdded(answerRef, async (snapshot) => {
    const answer = snapshot.val();
    const key = snapshot.key;
    if (!answer || answer.to !== callerId) return;

    const fromId = answer.from;
    const pc = peerConnections[fromId];
    if (!pc) return;

    pc.ontrack = (event) => {
      onTrack(event.streams[0], fromId);
    };

    await pc.setRemoteDescription(new RTCSessionDescription({ sdp: answer.sdp, type: answer.type }));
  });
};

export const listenForCandidates = (roomId, userId) => {
  const candidateRef = ref(database, `rooms/${roomId}/candidates`);
  onChildAdded(candidateRef, async (snapshot) => {
    const candidate = snapshot.val();
    if (!candidate) return;

    const from = candidate.from;
    const to = candidate.to;

    const isReceiver = to === userId;
    const isCaller = from === userId;

    const peerId = isReceiver ? from : to;
    const pc = peerConnections[peerId];

    if (pc) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("❌ Error adding ICE candidate", err);
      }
    }
  });
};

export const hangUp = async (roomId) => {
  Object.values(peerConnections).forEach((pc) => pc.close());
  Object.keys(peerConnections).forEach((key) => delete peerConnections[key]);
  await remove(ref(database, `rooms/${roomId}`));
};

export const toggleMute = () => {
  if (localStream) {
    const audioTrack = localStream.getAudioTracks()[0];
    audioTrack.enabled = !audioTrack.enabled;
    return !audioTrack.enabled;
  }
};
