import socket from "../component/socket";
import { database, ref, set, onValue, remove, push } from "../firebase";

// let pc = null;

// export const startMedia = async (localVideoRef) => {
//     const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
//     localVideoRef.srcObject = localStream;
//     return { localStream };
// };

// function createPeerConnection(callId, localStream, remoteVideoRef, role = "caller") {
//     pc = new RTCPeerConnection({
//         iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
//     });
//     if(localStream)
//     localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

//     pc.ontrack = (event) => {
//         if (remoteVideoRef) {
//             remoteVideoRef.srcObject = event.streams[0];
//         }
//     };

//     // 🔥 Send ICE candidates
//     pc.onicecandidate = (event) => {
//         if (event.candidate) {
//             const candidateRef = ref(database, `calls/${callId}/${role === "caller" ? "callerCandidates" : "calleeCandidates"}`);
//             push(candidateRef, event.candidate.toJSON());
//         }
//     };

//     return { pc };
// };

// export const createCall = async (callId, userId, localStreamRef, remoteVideoRef) => {
//     createPeerConnection(callId, localStreamRef, remoteVideoRef);
//     socket.emit("____incoming_call____", { userId, callId });
//     const callRef = ref(database, `calls/${callId}`);
//     const offer = await pc.createOffer();
//     await pc.setLocalDescription(offer);
//     await set(callRef, {
//         offer: {
//             type: offer.type,
//             sdp: offer.sdp,
//         }
//     });

//     onValue(ref(database, `calls/${callId}/answer`), async (snapshot) => {
//         const data = snapshot.val();
//         if (!pc.remoteDescription && data) {
//             const answer = new RTCSessionDescription(data);
//             await pc.setRemoteDescription(answer);
//         }
//     });

//     onValue(ref(database, `calls/${callId}/calleeCandidates`), (snapshot) => {
//         snapshot.forEach(child => {
//             const candidate = new RTCIceCandidate(child.val());
//             if(pc)
//             pc.addIceCandidate(candidate);
//         });
//     });
// };

// export const joinCall = async (callId, localStreamRef, remoteVideoRef) => {
//     createPeerConnection(callId, localStreamRef, remoteVideoRef);
//     const callRef = ref(database, `calls/${callId}`);

//     const snapshot = await new Promise(resolve => {
//         onValue(callRef, resolve, { onlyOnce: true });
//     });

//     const data = snapshot.val();
//     if (!data?.offer) return;

//     await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
//     const answer = await pc.createAnswer();
//     if(answer)
//     await pc.setLocalDescription(answer);

//     await set(ref(database, `calls/${callId}/answer`), {
//         type: answer.type,
//         sdp: answer.sdp,
//     });

//     onValue(ref(database, `calls/${callId}/callerCandidates`), (snapshot) => {
//         snapshot.forEach(child => {
//             const candidate = new RTCIceCandidate(child.val());
//             pc.addIceCandidate(candidate);
//         });
//     });
// };

// export const hangUp = async (callId) => {
//     if (pc) pc.close();
//     await remove(ref(database, `calls/${callId}`));
// };

// export const toggleMute = (localVideoRef) => {
//     const stream = localVideoRef.srcObject;
//     if (!stream) return;

//     const audioTrack = stream.getAudioTracks()[0];
//     audioTrack.enabled = !audioTrack.enabled;
//     return !audioTrack.enabled;
// };



// ✅ firebase and socket already imported
let pc = null;

let existingStream = null;

export const startMedia = async (localVideoRef) => {
    try {
        if (!existingStream) {
            existingStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        }
        if (localVideoRef) {
            localVideoRef.srcObject = existingStream;
        }
        return { localStream: existingStream };
    } catch (err) {
        throw new Error("Could not start video/audio. Make sure camera and mic are available and allowed.");
    }
};

export const createPeerConnection = (localStream, remoteVideoRef, callId, role = "caller") => {
    pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    if (localStream) {
        localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    }

    pc.ontrack = (event) => {
        if (remoteVideoRef) {
            remoteVideoRef.srcObject = event.streams[0];
        }
    };

    pc.onicecandidate = (event) => {
        if (event.candidate) {
            const candidatesRef = ref(database, `calls/${callId}/${role === "caller" ? "callerCandidates" : "calleeCandidates"}`);
            push(candidatesRef, event.candidate.toJSON());
        }
    };
};

export const createCall = async (callId, userId, localStream, remoteVideoRef) => {
    createPeerConnection(localStream, remoteVideoRef, callId, "caller");

    socket.emit("____incoming_call____", { userId, callId });

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const callRef = ref(database, `calls/${callId}`);
    await set(callRef, {
        offer: {
            type: offer.type,
            sdp: offer.sdp,
        }
    });

    onValue(ref(database, `calls/${callId}/answer`), async (snapshot) => {
        const data = snapshot.val();
        if (data && !pc.currentRemoteDescription) {
            const answer = new RTCSessionDescription(data);
            await pc.setRemoteDescription(answer);
        }
    });

    onValue(ref(database, `calls/${callId}/calleeCandidates`), (snapshot) => {
        snapshot.forEach(child => {
            const candidate = new RTCIceCandidate(child.val());
            pc.addIceCandidate(candidate);
        });
    });
};

export const joinCall = async (callId, localStream, remoteVideoRef) => {
    createPeerConnection(localStream, remoteVideoRef, callId, "callee");

    const callRef = ref(database, `calls/${callId}`);
    const snapshot = await new Promise(resolve => onValue(callRef, resolve, { onlyOnce: true }));

    const data = snapshot.val();
    if (!data?.offer) return;

    await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    await set(ref(database, `calls/${callId}/answer`), {
        type: answer.type,
        sdp: answer.sdp,
    });

    onValue(ref(database, `calls/${callId}/callerCandidates`), (snapshot) => {
        snapshot.forEach(child => {
            const candidate = new RTCIceCandidate(child.val());
            pc.addIceCandidate(candidate);
        });
    });
};

export const hangUp = async (callId) => {
    if (pc) {
        pc.close();
        pc = null;
    }
    await remove(ref(database, `calls/${callId}`));
};

export const toggleMute = (localVideoRef) => {
    const stream = localVideoRef.srcObject;
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    audioTrack.enabled = !audioTrack.enabled;
    return !audioTrack.enabled;
};
