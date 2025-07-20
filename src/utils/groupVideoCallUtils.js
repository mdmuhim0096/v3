
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
    let attached = false;

    const attachRemoteStream = () => {
      const videoEl = remoteRef?.current;
      if (!videoEl) {
        if (retries < 20) {
          retries++;
          return setTimeout(attachRemoteStream, 200);
        } else {
          console.warn("❌ remote video element not found after 20 retries");
          return;
        }
      }

      if (!attached) {
        videoEl.srcObject = remoteStream;
        videoEl.muted = true; // still needed for autoplay on mobile
        videoEl.autoplay = true;
        videoEl.playsInline = true;
        attached = true;
      }

      videoEl
        .play()
        .then(() => {
          console.log("▶️ Remote video playing");
        })
        .catch((err) => {
          if (retries < 10) {
            console.warn("🔄 Retrying remote video playback...", err.message);
            retries++;
            setTimeout(attachRemoteStream, 300); // Retry only if play fails
          } else {
            console.error("❌ Still failed to play remote video after 10 retries");
          }
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

  console.log("--__-----__--: ", remoteVideoRef)

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

  console.log("--__-----__--: ", remoteVideoRef)

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

