// src/utils/webrtcUtils.js
let localStream;
const peers = {};

export const getLocalStream = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    return stream;
  } catch (err) {
    console.error("🚫 Failed to get local media:", err);
    alert("Please allow access to your camera/microphone and make sure no other app is using them.");
    throw err;
  }
};

export const createPeerConnection = (peerId, addTrackCallback) => {
  const pc = new RTCPeerConnection();
  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
  pc.ontrack = event => addTrackCallback(peerId, event.streams[0]);
  peers[peerId] = pc;
  return pc;
};

export const getPeers = () => peers;
export const getLocal = () => localStream;

export const closeAllConnections = () => {
  Object.values(peers).forEach(pc => pc.close());
};
