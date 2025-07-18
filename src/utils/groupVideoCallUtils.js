// src/utils/groupVideoCallUtils.js
import socket from "../component/socket";
import { database } from "../firebase";
import {
    ref,
    set,
    push,
    onChildAdded,
    onChildRemoved,
    remove,
} from "firebase/database";

let localStream;
const peerConnections = {};
const config = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

export const startMedia = async () => {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    return localStream;
};

export const createCall = async (roomId, userId) => {
    const offerRef = ref(database, `rooms/${roomId}/offers/${userId}`);
    const pc = new RTCPeerConnection(config);
    peerConnections[userId] = pc;
    socket.emit("join_room", {roomId, userId});
    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    await set(offerRef, {
        sdp: offer.sdp,
        type: offer.type,
        from: userId,
    });

    pc.onicecandidate = (event) => {
        if (event.candidate) {
            const candidateRef = push(ref(database, `rooms/${roomId}/candidates/${userId}`));
            set(candidateRef, event.candidate.toJSON());
        }
    };
};

export const receiveCall = async (roomId, callerId, receiverId, onTrack) => {
    const offerRef = ref(database, `rooms/${roomId}/offers/${callerId}`);
    const snapshot = await new Promise((res) => {
        onChildAdded(offerRef, (snap) => res(snap));
    });

    const offerData = snapshot.val();
    const pc = new RTCPeerConnection(config);
    peerConnections[callerId] = pc;

    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

    pc.ontrack = (event) => {
        onTrack(event.streams[0], callerId);
    };

    await pc.setRemoteDescription(new RTCSessionDescription(offerData));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    const answerRef = ref(database, `rooms/${roomId}/answers/${receiverId}`);
    await set(answerRef, {
        sdp: answer.sdp,
        type: answer.type,
        to: callerId,
    });

    pc.onicecandidate = (event) => {
        if (event.candidate) {
            const candidateRef = push(ref(database, `rooms/${roomId}/candidates/${receiverId}`));
            set(candidateRef, event.candidate.toJSON());
        }
    };
};

export const listenForAnswers = (roomId, userId) => {
    const answerRef = ref(database, `rooms/${roomId}/answers`);
    onChildAdded(answerRef, async (snapshot) => {
        const answer = snapshot.val();
        if (answer.to === userId) {
            const pc = peerConnections[userId];
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
    });
};

export const listenForCandidates = (roomId, userId) => {
    const candidateRef = ref(database, `rooms/${roomId}/candidates`);
    onChildAdded(candidateRef, async (snapshot) => {
        const candidate = snapshot.val();
        const pc = peerConnections[userId];
        if (pc) {
            try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
                console.error("Error adding ICE candidate", err);
            }
        }
    });
};

export const hangUp = async (roomId) => {
    Object.values(peerConnections).forEach(pc => pc.close());
    await remove(ref(database, `rooms/${roomId}`));
};

export const toggleMute = () => {
    if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0];
        audioTrack.enabled = !audioTrack.enabled;
        return !audioTrack.enabled;
    }
};
