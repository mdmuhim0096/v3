// src/components/AudioCall.jsx
import React, { useEffect, useRef, useState } from "react";
import { startMedia, createCall, joinCall, hangUp, toggleMute } from "../utils/audioCallUtils";
import socket from "./socket"; // fixed import path
import { useLocation, useNavigate } from "react-router-dom";

const AudioCall = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { callId, userId, role, isDail } = location?.state || {};

    const localAudioRef = useRef();
    const remoteAudioRef = useRef();
    const [muted, setMuted] = useState(false);
    const localStreamRef = useRef(null); // Store local stream for later use

    useEffect(() => {
        if (role === "caller") {
            createCall__();
        }
    }, []);

    async function createCall__() {
        try {
            const { localStream } = await startMedia(localAudioRef.current);
            localStreamRef.current = localStream;
            await createCall(callId, userId, localStream, remoteAudioRef.current);
        } catch (err) {
            console.error("Call creation error:", err.message);
        }
    };

    async function joinCall__() {
        try {
            const { localStream } = await startMedia(localAudioRef.current);
            localStreamRef.current = localStream;
            await joinCall(callId, localStream, remoteAudioRef.current);
        } catch (err) {
            console.error("Call join error:", err.message);
        }
    };

    const hangUpCall = () => {
        hangUp(callId);
        socket.emit("end_call_a", { callId });
        navigate("/chatroom");
        window.location.reload();
    };

    useEffect(() => {
        const endHandler = () => {
            hangUp(callId);
            navigate("/chatroom");
            window.location.reload();
        };
        socket.on("end_call_a", endHandler);
        return () => {
            socket.off("end_call_a", endHandler);
        };
    }, []);

    return (
        <div className="p-4 border max-w-md mx-auto mt-10 bg-white rounded shadow">
            <h2 className="text-xl font-semibold mb-3">Audio Call</h2>
            <audio ref={localAudioRef} autoPlay muted />
            <audio ref={remoteAudioRef} autoPlay />

            <div className="mt-4 flex gap-4">
                <button onClick={joinCall__} className={`bg-green-500 px-4 py-2 rounded ${isDail ? "hidden" : ""}`}>Receive</button>
                <button
                    onClick={() => setMuted(toggleMute(localAudioRef.current))}
                    className="bg-yellow-500 px-4 py-2 rounded text-white"
                >
                    {muted ? "Unmute" : "Mute"}
                </button>
                <button onClick={hangUpCall} className="bg-red-500 px-4 py-2 rounded text-white">Hang Up</button>
            </div>
        </div>
    );
};

export default AudioCall;
