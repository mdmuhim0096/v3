
import { getDatabase, ref, set, onValue, remove, push } from 'firebase/database';
import { initializeApp } from 'firebase/app';
import socket from '../component/socket';

 const firebaseConfig = {
  apiKey: "AIzaSyB3-LW70CnKpUpkcnbTuLmX2lpheHrPliI",
  authDomain: "contact-form-2-405610.firebaseapp.com",
  projectId: "contact-form-2-405610",
  storageBucket: "contact-form-2-405610.appspot.com",
  messagingSenderId: "200076844672",
  appId: "1:200076844672:web:daf2b3178791665e88d065",
  measurementId: "G-M7MNNC029J"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const servers = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

let localStream = null;
const peerConnections = {};
const remoteStreams = {};
let hasJoined = false;

export async function startGroupMedia(localVideoRef) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

    localStream = stream;
    if (localVideoRef) localVideoRef.srcObject = stream;

    return stream;
  } catch (err) {
    console.error("🚫 Media access error:", err);
    alert("🚫 Failed to access camera/mic. Please check permissions or make sure no other app is using it.");
    throw new Error('Could not access camera/mic: ' + err.message);
  }
}

export function getRemoteStreams() {
  return remoteStreams;
}

export async function joinGroupRoom(roomId, userId) {
  if (hasJoined) return;
  const peersRef = ref(database, `rooms/${roomId}/peers`);
  const myRef = push(peersRef);
  await set(myRef, userId);
  socket.emit("join_room", roomId);
  hasJoined = true;
  return myRef.key;
}

export async function listenForOffers(roomId, localId, onOfferReceived) {
  const offersRef = ref(database, `calls/${roomId}/offers`);
  onValue(offersRef, (snapshot) => {
    const offers = snapshot.val() || {};
    for (const [key, offer] of Object.entries(offers)) {
      if (key.endsWith(`_to_${localId}`)) {
        const fromId = key.split('_to_')[0];
        onOfferReceived(fromId, offer);
      }
    }
  });
}

export async function manuallyAnswerOffer(roomId, localId, remoteId, offer, onTrackCallback) {
  const pc = new RTCPeerConnection(servers);
  peerConnections[remoteId] = pc;

  localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

  const remoteStream = new MediaStream();
  remoteStreams[remoteId] = remoteStream;

  pc.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
    onTrackCallback(remoteId, remoteStream);
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      const candidatesRef = ref(database, `calls/${roomId}/candidates/${localId}_to_${remoteId}`);
      push(candidatesRef, event.candidate.toJSON());
    }
  };

  await pc.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  await set(ref(database, `calls/${roomId}/answers/${localId}_to_${remoteId}`), answer);

  // Handle ICE from remote peer
  onValue(ref(database, `calls/${roomId}/candidates/${remoteId}_to_${localId}`), (snap) => {
    const candidates = snap.val();
    if (candidates) {
      Object.values(candidates).forEach(async (candidate) => {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      });
    }
  });
}


export async function callPeer(roomId, localId, remoteId, onTrackCallback) {
  const pc = new RTCPeerConnection(servers);
  peerConnections[remoteId] = pc;

  const remoteStream = new MediaStream();
  remoteStreams[remoteId] = remoteStream;

  localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

  pc.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
    onTrackCallback(remoteId, remoteStream);
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      const candidatesRef = ref(database, `calls/${roomId}/candidates/${localId}_to_${remoteId}`);
      push(candidatesRef, event.candidate.toJSON());
    }
  };

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  await set(ref(database, `calls/${roomId}/offers/${localId}_to_${remoteId}`), offer);

  onValue(ref(database, `calls/${roomId}/answers/${remoteId}_to_${localId}`), async (snap) => {
    const data = snap.val();
    if (data && !pc.currentRemoteDescription) {
      await pc.setRemoteDescription(new RTCSessionDescription(data));
    }
  });

  onValue(ref(database, `calls/${roomId}/candidates/${remoteId}_to_${localId}`), (snap) => {
    const candidates = snap.val();
    if (candidates) {
      Object.values(candidates).forEach(async (candidate) => {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      });
    }
  });
}

export async function hangUpGroup(roomId, userId) {
  // ✅ Safely close all peer connections
  Object.values(peerConnections).forEach((pc) => {
    if (pc && typeof pc.close === "function") {
      pc.close();
    }
  });

  // 🧹 Clear references
  Object.keys(peerConnections).forEach((id) => delete peerConnections[id]);
  Object.keys(remoteStreams).forEach((id) => delete remoteStreams[id]);

  if (localStream) {
    localStream.getTracks().forEach((t) => t.stop());
  }

  // 🧽 Cleanup Firebase paths
  await remove(ref(database, `rooms/${roomId}/peers`));
  await remove(ref(database, `calls/${roomId}/offers`));
  await remove(ref(database, `calls/${roomId}/answers`));
  await remove(ref(database, `calls/${roomId}/candidates`));
}

