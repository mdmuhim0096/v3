// videoCallUtils.js
import { getDatabase, ref, set, onValue, remove, push } from "firebase/database";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "./firebaseConfig";

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const servers = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

let pc = null;
let localStream = null;
let remoteStream = null;

/**
 * Initializes media devices
 */
export async function startMedia(localVideo, remoteVideo) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    localStream = stream;
    if (localVideo) localVideo.srcObject = stream;

    remoteStream = new MediaStream();
    if (remoteVideo) remoteVideo.srcObject = remoteStream;

    return { localStream, remoteStream };
  } catch (err) {
    throw new Error("Could not get media: " + err.message);
  }
}

/**
 * Creates peer connection and attaches tracks
 */
export function createPeerConnection(callId, roomCreated) {
  pc = new RTCPeerConnection(servers);

  // Add local tracks
  localStream?.getTracks().forEach(track => {
    pc.addTrack(track, localStream);
  });

  // Listen for remote tracks
  pc.ontrack = event => {
    event.streams[0].getTracks().forEach(track => {
      remoteStream?.addTrack(track);
    });
  };

  // Send ICE candidates
  pc.onicecandidate = event => {
    if (event.candidate) {
      const candidatesRef = ref(database, `calls/${callId}/candidates/${roomCreated ? "offer" : "answer"}`);
      push(candidatesRef, event.candidate.toJSON());
    }
  };

  return pc;
}

/**
 * Create a WebRTC offer and store it in Firebase
*/

export async function createCall(callId, roomCreated, socket, friendId, myImage, myName, uniqueId) {
  if (!callId) throw new Error("Call ID is missing");

  const pc = createPeerConnection(callId, roomCreated);

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  await set(ref(database, `calls/${callId}/offer`), offer);
  console.log(friendId, "friendId")
  socket.emit("incoming_call", {friendId, myImage, myName, uniqueId});
  onValue(ref(database, `calls/${callId}/answer`), async snapshot => {
    const data = snapshot.val();
    if (data && !pc.currentRemoteDescription) {
      await pc.setRemoteDescription(new RTCSessionDescription(data));
    }
  });

  onValue(ref(database, `calls/${callId}/candidates/answer`), snapshot => {
    const candidates = snapshot.val();
    if (candidates) {
      Object.values(candidates).forEach(async candidate => {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      });
    }
  });
}

/**
 * Join an existing call using Firebase offer
 */

export async function joinCall(callId) {
  const callRef = ref(database, `calls/${callId}`);
  onValue(callRef, async snapshot => {
    const data = snapshot.val();
    if (!data?.offer) return;

    if (!pc.currentRemoteDescription) {
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await set(ref(database, `calls/${callId}/answer`), answer);
    }
  });

  onValue(ref(database, `calls/${callId}/candidates/offer`), snapshot => {
    const candidates = snapshot.val();
    if (candidates) {
      Object.values(candidates).forEach(async candidate => {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      });
    }
  });
}

/**
 * Ends the call and cleans up
 */
export async function hangUp(callId) {
  pc?.close();
  await remove(ref(database, `calls/${callId}`));
}
