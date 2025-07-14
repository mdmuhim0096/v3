import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { ref, set, onValue, remove } from "firebase/database";
import { firebaseConfig } from "./firebaseConfig";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let localStream = null;
let remoteStream = null;
let pc = null;

// ICE server config
const servers = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
  ]
};

/**
 * Start microphone (audio-only)
 */
export async function startMedia(localAudio, remoteAudio) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
    localStream = stream;
    if (localAudio) localAudio.srcObject = stream;

    remoteStream = new MediaStream();
    if (remoteAudio) remoteAudio.srcObject = remoteStream;

    return { localStream, remoteStream };
  } catch (err) {
    throw new Error("Could not get audio: " + err.message);
  }
}

/**
 * Create peer connection and attach audio tracks
 */
export function createPeerConnection(callId, roomCreated) {
  pc = new RTCPeerConnection(servers);

  // Add local tracks
  localStream?.getTracks().forEach(track => {
    pc.addTrack(track, localStream);
  });

  // Handle remote tracks
  pc.ontrack = (event) => {
    event.streams[0].getTracks().forEach(track => {
      remoteStream?.addTrack(track);
    });
  };

  // Handle ICE
  pc.onicecandidate = event => {
    if (event.candidate) {
      const icePath = `calls/${callId}/candidates/${roomCreated ? "offer" : "answer"}`;
      const candidatesRef = ref(db, icePath);
      push(candidatesRef, event.candidate.toJSON());
    }
  };

  return pc;
}

/**
 * Create a call (send offer)
 */
export async function ___createCall___(callId, socket, friendId, myImage, myName, uniqueId_audio) {
  if (!callId) throw new Error("Missing callId");
  const pc = createPeerConnection(callId, true);

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  await set(ref(db, `calls/${callId}/offer`), offer);

  // Notify receiver
  socket.emit("____incoming_call____", { friendId, myImage, myName, uniqueId_audio });

  // Listen for answer
  onValue(ref(db, `calls/${callId}/answer`), async (snapshot) => {
    const answer = snapshot.val();
    if (answer && !pc.currentRemoteDescription) {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    }
  });

  // Listen for ICE candidates from receiver
  onValue(ref(db, `calls/${callId}/candidates/answer`), snapshot => {
    const candidates = snapshot.val();
    if (candidates) {
      Object.values(candidates).forEach(async candidate => {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      });
    }
  });
}

/**
 * Join an existing call (respond to offer)
 */
export async function joinCall(callId) {
  const pc = createPeerConnection(callId, false);
  const callRef = ref(db, `calls/${callId}`);

  onValue(callRef, async (snapshot) => {
    const data = snapshot.val();
    if (!data?.offer) return;

    if (!pc.currentRemoteDescription) {
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await set(ref(db, `calls/${callId}/answer`), answer);
    }
  });

  onValue(ref(db, `calls/${callId}/candidates/offer`), snapshot => {
    const candidates = snapshot.val();
    if (candidates) {
      Object.values(candidates).forEach(async candidate => {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      });
    }
  });
}

/**
 * End the call and clear DB
 */
export async function hangUp(callId) {
  pc?.close();
  pc = null;
  localStream?.getTracks().forEach(track => track.stop());
  localStream = null;
  remoteStream = null;
  await remove(ref(db, `calls/${callId}`));
}
