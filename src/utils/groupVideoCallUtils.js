
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
    if (!remoteStream) return;

    let retries = 0;

    const waitAndAttach = () => {
      const videoEl = remoteRef?.current;

      if (!videoEl) {
        if (retries < 20) {
          retries++;
          console.warn("⌛ Waiting for remote video element...");
          return setTimeout(waitAndAttach, 300);
        } else {
          console.error("❌ remoteVideoRef not ready after 20 retries");
          return;
        }
      }

      console.log("✅ remoteVideoRef found", videoEl);

      // ⛔️ Avoid reassigning same stream
      if (videoEl.srcObject !== remoteStream) {
        console.log("🎬 Assigning remote stream...");
        videoEl.srcObject = remoteStream;
      }

      videoEl.muted = true; // Always for autoplay safety
      videoEl.autoplay = true;
      videoEl.playsInline = true;

      // ⛔️ remove other retry logic — just one play
      videoEl
        .play()
        .then(() => {
          console.log("▶️ Remote video playing!");
        })
        .catch((err) => {
          console.warn("❌ play() failed:", err.message);
        });
    };

    waitAndAttach();
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
  const peerId = "caller";

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

  // Confirm remoteRef is mounted before continuing
  if (!remoteVideoRef?.current) {
    console.warn("❌ remoteVideoRef not ready at call receive");
    await new Promise((res) => setTimeout(res, 500)); // wait a tick
  }

  const offerSnap = await new Promise((resolve) => {
    onValue(ref(database, `calls/${callId}/offer`), resolve, { onlyOnce: true });
  });

  const offerData = offerSnap.val();
  if (!offerData) {
    console.warn("❌ No offer found");
    return;
  }

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

