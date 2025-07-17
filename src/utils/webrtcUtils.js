// src/utils/webrtcUtils.js

let localStream = null;
const peers = {};

// 🔊 Get local camera + mic
export const getLocalStream = async () => {
  if (localStream) return localStream;

  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    return localStream;
  } catch (err) {
    console.error("🚫 Failed to get local media:", err);
    alert("Please allow access to your camera/microphone and make sure no other app is using them.");
    throw err;
  }
};

// 📡 Create peer connection and add local tracks
export const createPeerConnection = (peerId, onTrackCallback) => {
  const pc = new RTCPeerConnection();

  const stream = getLocal();
  if (stream) {
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });
  } else {
    console.warn("⚠️ No local stream found when creating peer connection");
  }

  pc.ontrack = (event) => {
    const stream = event.streams[0];
    if (onTrackCallback) onTrackCallback(peerId, stream);
  };

  peers[peerId] = pc;
  return pc;
};

// 🔎 Get all peer connections
export const getPeers = () => peers;

// 🔁 Get the current local stream
export const getLocal = () => localStream;

// ❌ Close all peer connections and clean up
export const closeAllConnections = () => {
  Object.values(peers).forEach(pc => pc.close());
  Object.keys(peers).forEach(key => delete peers[key]);

  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }
};
