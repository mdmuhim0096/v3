// groupVideoCallUtils.js
import { getDatabase, ref, set, onValue, remove, push } from 'firebase/database';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from './firebaseConfig';
import socket from '../component/socket';

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const servers = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

let localStream = null;
const peerConnections = {}; // key: peerId, value: RTCPeerConnection
const remoteStreams = {}; // key: peerId, value: MediaStream

export async function startGroupMedia(localVideoRef) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

    localStream = stream; // ✅ assign immediately
    if (localVideoRef) localVideoRef.srcObject = stream;

    return stream;
  } catch (err) {
    throw new Error('Could not access camera/mic: ' + err.message);
  }
}


export function getRemoteStreams() {
  return remoteStreams;
}

export async function joinGroupRoom(roomId, userId, onTrackCallback) {
  const peersRef = ref(database, `rooms/${roomId}/peers`);
  const myRef = push(peersRef);
  await set(myRef, userId);

  // Listen for other peers
  onValue(peersRef, (snapshot) => {
    const peers = snapshot.val() || {};
    Object.entries(peers).forEach(([key, peerId]) => {
      if (peerId !== userId && !peerConnections[peerId]) {
        connectToNewPeer(roomId, userId, peerId, onTrackCallback);
      }
    });
  });

  socket.emit("groupvideocall", roomId);

  return myRef.key;
}

async function connectToNewPeer(roomId, localId, remoteId, onTrackCallback) {
  if (!localStream) {
    console.warn("connectToNewPeer: localStream not initialized yet");
    // Optional: Retry after a short delay
    setTimeout(() => {
      connectToNewPeer(roomId, localId, remoteId, onTrackCallback);
    }, 500); // retry after 500ms
    return;
  }

  const pc = new RTCPeerConnection(servers);

  localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

  const remoteStream = new MediaStream();
  remoteStreams[remoteId] = remoteStream;

  pc.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
      onTrackCallback(remoteId, remoteStream);
    });
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      const candidatesRef = ref(database, `calls/${roomId}/candidates/${localId}_to_${remoteId}`);
      push(candidatesRef, event.candidate.toJSON());
    }
  };

  peerConnections[remoteId] = pc;

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  await set(ref(database, `calls/${roomId}/offers/${localId}_to_${remoteId}`), offer);

  // Listen for answer
  onValue(ref(database, `calls/${roomId}/answers/${remoteId}_to_${localId}`), async (snap) => {
    const data = snap.val();
    if (data && !pc.currentRemoteDescription) {
      await pc.setRemoteDescription(new RTCSessionDescription(data));
    }
  });

  // ICE from remote
  onValue(ref(database, `calls/${roomId}/candidates/${remoteId}_to_${localId}`), (snap) => {
    const candidates = snap.val();
    if (candidates) {
      Object.values(candidates).forEach(async (candidate) => {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      });
    }
  });
}

export async function listenForOffersAndAnswer(roomId, localId) {
  const offersRef = ref(database, `calls/${roomId}/offers`);
  onValue(offersRef, async (snapshot) => {
    const offers = snapshot.val() || {};
    for (const [key, offer] of Object.entries(offers)) {
      if (key.endsWith(`_to_${localId}`)) {
        const fromId = key.split('_to_')[0];
        if (!peerConnections[fromId]) {
          await answerOffer(roomId, localId, fromId, offer);
        }
      }
    }
  });
}

async function answerOffer(roomId, localId, remoteId, offer) {
  const pc = new RTCPeerConnection(servers);
  peerConnections[remoteId] = pc;

  localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

  const remoteStream = new MediaStream();
  remoteStreams[remoteId] = remoteStream;

  pc.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
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

  // ICE from offerer
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
  Object.values(peerConnections).forEach((pc) => pc.close());
  Object.keys(remoteStreams).forEach((id) => delete remoteStreams[id]);

  if (localStream) {
    localStream.getTracks().forEach((t) => t.stop());
  }

  await remove(ref(database, `rooms/${roomId}/peers`));
  await remove(ref(database, `calls/${roomId}/offers`));
  await remove(ref(database, `calls/${roomId}/answers`));
  await remove(ref(database, `calls/${roomId}/candidates`));
  peerConnections[userId] = null;
}
