import socket from "../component/socket";
import { database, ref, set, onValue, remove, push } from "../firebase";

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
    socket.emit("join_call_v", callId);
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
