
// import { database, ref, set, onValue, remove, push, onChildAdded } from "../firebase";
// import socket from "../component/socket";

// let peerConnections = {};
// let localStream = null;

// export const startMedia = async (videoRef) => {
//   if (!localStream) {
//     try {
//       localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
//     } catch (err) {
//       console.error("🚫 Media access error:", err);
//       return;
//     }
//   }
// };


// const createPeerConnection = (remoteRef, callId, peerId) => {

//   const pc = new RTCPeerConnection({
//     iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
//   });

//   if (localStream) {
//     localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
//   }

//   pc.ontrack = (event) => {
//     const [remoteStream] = event.streams;
//     if (!remoteStream) return;

//     let retries = 0;

//     const waitAndAttach = () => {
//       const videoEl = remoteRef?.current;

//       if (!videoEl) {
//         if (retries < 20) {
//           retries++;
//           console.warn("⌛ Waiting for remote video element...");
//           return setTimeout(waitAndAttach, 300);
//         } else {
//           console.error("❌ remoteVideoRef not ready after 20 retries");
//           return;
//         }
//       }

//       console.log("✅ remoteVideoRef found", videoEl);

//       // ⛔️ Avoid reassigning same stream
//       if (videoEl.srcObject !== remoteStream) {
//         console.log("🎬 Assigning remote stream...");
//         videoEl.srcObject = remoteStream;
//       }

//       videoEl.muted = true; // Always for autoplay safety
//       videoEl.autoplay = true;
//       videoEl.playsInline = true;

//       // ⛔️ remove other retry logic — just one play
//       videoEl
//         .play()
//         .then(() => {
//           console.log("▶️ Remote video playing!");
//         })
//         .catch((err) => {
//           console.warn("❌ play() failed:", err.message);
//         });
//     };

//     waitAndAttach();
//   };

//   pc.onicecandidate = (event) => {
//     if (event.candidate) {
//       const candidateRef = ref(database, `calls/${callId}/candidates/${peerId}`);
//       push(candidateRef, event.candidate.toJSON());
//     }
//   };

//   return pc;
// };


// export const createCall = async (callId, remoteVideoRef) => {
//   const peerId = "caller";

//   if (!localStream) {
//     localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
//   }

//   const pc = createPeerConnection(remoteVideoRef, callId, peerId);
//   peerConnections[peerId] = pc;

//   socket.emit("join_room", callId);

//   const offer = await pc.createOffer();
//   await pc.setLocalDescription(offer);
//   await set(ref(database, `calls/${callId}/offer`), offer);

//   onValue(ref(database, `calls/${callId}/answer`), async (snapshot) => {
//     const data = snapshot.val();
//     if (data && !pc.currentRemoteDescription) {
//       await pc.setRemoteDescription(new RTCSessionDescription(data));
//     }
//   });

//   onChildAdded(ref(database, `calls/${callId}/candidates/receiver`), async (snapshot) => {
//     const candidate = new RTCIceCandidate(snapshot.val());
//     await pc.addIceCandidate(candidate);
//   });
// };


// export const receiveCall = async (callId, remoteVideoRef) => {
//   const peerId = "receiver";

//   if (!localStream) {
//     localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
//   }

//   // Confirm remoteRef is mounted before continuing
//   if (!remoteVideoRef?.current) {
//     console.warn("❌ remoteVideoRef not ready at call receive");
//     await new Promise((res) => setTimeout(res, 500)); // wait a tick
//   }

//   const offerSnap = await new Promise((resolve) => {
//     onValue(ref(database, `calls/${callId}/offer`), resolve, { onlyOnce: true });
//   });

//   const offerData = offerSnap.val();
//   if (!offerData) {
//     console.warn("❌ No offer found");
//     return;
//   }

//   const pc = createPeerConnection(remoteVideoRef, callId, peerId);
//   peerConnections[peerId] = pc;

//   await pc.setRemoteDescription(new RTCSessionDescription(offerData));
//   const answer = await pc.createAnswer();
//   await pc.setLocalDescription(answer);
//   await set(ref(database, `calls/${callId}/answer`), answer);

//   onChildAdded(ref(database, `calls/${callId}/candidates/${peerId}`), async (snapshot) => {
//     const candidate = new RTCIceCandidate(snapshot.val());
//     await pc.addIceCandidate(candidate);
//   });
// };


// export const toggleMute = () => {
//   if (!localStream) return;
//   const audioTrack = localStream.getAudioTracks()[0];
//   if (audioTrack) {
//     audioTrack.enabled = !audioTrack.enabled;
//     return !audioTrack.enabled;
//   }
// };

// export const hangUp = async (callId) => {
//   Object.values(peerConnections).forEach((pc) => pc.close());
//   peerConnections = {};
//   await remove(ref(database, `calls/${callId}`));
// };



// groupVideoCallUtils.js
import { database, ref, set, onValue, remove, push, onChildAdded } from "../firebase";
import socket from "../component/socket";

let peerConnections = {};
let localStream = null;

// 📷 Start media
export const startMedia = async (videoRef) => {
  if (!localStream) {
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch (err) {
      console.error("🚫 Media access error:", err);
      return;
    }
  }

  if (videoRef?.current && localStream) {
    videoRef.current.srcObject = localStream;
    videoRef.current.muted = true;
    videoRef.current.autoplay = true;
    videoRef.current.playsInline = true;
    try {
      await videoRef.current.play();
    } catch (err) {
      console.warn("⚠️ local video play() error:", err.message);
    }
  }
};

// 🔗 Create peer connection
const createPeerConnection = (remoteRef, callId, peerId) => {
  const pc = new RTCPeerConnection({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      {
        urls: "turn:openrelay.metered.ca:80",
        username: "openrelayproject",
        credential: "openrelayproject"
      }
    ]
  });

  if (localStream) {
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
  }

  pc.ontrack = (event) => {
    console.log("📡 ontrack received from:", peerId, event.track.kind);

    let remoteStream = event.streams[0];
    if (!remoteStream) {
      remoteStream = new MediaStream();
      remoteStream.addTrack(event.track);
    }

    const attachStream = () => {
      const videoEl = remoteRef?.current;
      if (!videoEl) {
        console.warn("❌ remote video element not ready.");
        return;
      }

      if (videoEl.srcObject !== remoteStream) {
        videoEl.srcObject = remoteStream;
        console.log("🎬 Remote stream attached.");
      }

      videoEl.muted = true;
      videoEl.autoplay = true;
      videoEl.playsInline = true;

      videoEl
        .play()
        .then(() => console.log("▶️ Remote video is playing."))
        .catch((err) => {
          console.error("❌ play() failed:", err.message);
          // 🔍 Show more context
          console.log("💡 Current srcObject:", videoEl.srcObject);
          console.log("💡 Ready state:", videoEl.readyState);
          console.log("💡 Can play type:", videoEl.canPlayType("video/webm"));
        });
    };

    let retries = 0;
    const waitForVideo = () => {
      if (!remoteRef?.current && retries < 20) {
        retries++;
        setTimeout(waitForVideo, 300);
      } else {
        attachStream();
      }
    };
    waitForVideo();
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      const candidateRef = ref(database, `calls/${callId}/candidates/${peerId}`);
      push(candidateRef, event.candidate.toJSON());
    }
  };

  return pc;
};

// 📞 Create call (caller)
export const createCall = async (callId, remoteVideoRef) => {
  const peerId = "caller";

  while (!remoteVideoRef?.current) {
    console.warn("🕰️ Waiting for remoteVideoRef...");
    await new Promise((res) => setTimeout(res, 300));
  }

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


export const receiveCall = async (callId, remoteVideoRef, localVideoRef) => {
  const peerId = "receiver";

  // Wait for remote video element
  while (!remoteVideoRef?.current) {
    console.warn("🕰️ Waiting for remoteVideoRef...");
    await new Promise((res) => setTimeout(res, 300));
  }

  // Get local media stream (video + audio)
  if (!localStream) {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  }

  // Attach localStream to localVideoRef if provided
  if (localVideoRef?.current && localStream) {
    localVideoRef.current.srcObject = localStream;
    localVideoRef.current.muted = true; // mute local preview
    localVideoRef.current.autoplay = true;
    localVideoRef.current.playsInline = true;
    try {
      await localVideoRef.current.play();
    } catch (err) {
      console.warn("⚠️ local video play error:", err.message);
    }
  }

  // Get offer from Firebase
  const offerSnap = await new Promise((resolve) => {
    onValue(ref(database, `calls/${callId}/offer`), resolve, { onlyOnce: true });
  });

  const offerData = offerSnap.val();
  if (!offerData) {
    console.warn("❌ No offer found");
    return;
  }

  // Create peer connection with remote video ref
  const pc = createPeerConnection(remoteVideoRef, callId, peerId);
  peerConnections[peerId] = pc;

  // Set remote description (offer)
  await pc.setRemoteDescription(new RTCSessionDescription(offerData));

  // Create and set local description (answer)
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  // Save answer in Firebase
  await set(ref(database, `calls/${callId}/answer`), answer);

  // Listen for ICE candidates from caller and add them
  const callerCandidatesRef = ref(database, `calls/${callId}/candidates/caller`);
  const unsubscribe = onChildAdded(callerCandidatesRef, async (snapshot) => {
    const candidate = new RTCIceCandidate(snapshot.val());
    await pc.addIceCandidate(candidate);
  });

  // Return cleanup to call on hangup or unmount
  return () => {
    unsubscribe();
    pc.close();
    delete peerConnections[peerId];
  };
};


// 🔇 Toggle mute
export const toggleMute = () => {
  if (!localStream) return;
  const audioTrack = localStream.getAudioTracks()[0];
  if (audioTrack) {
    audioTrack.enabled = !audioTrack.enabled;
    return !audioTrack.enabled;
  }
};

// ❌ Hang up
export const hangUp = async (callId) => {
  Object.values(peerConnections).forEach((pc) => pc.close());
  peerConnections = {};
  await remove(ref(database, `calls/${callId}`));
};
