
import React, { useEffect, useRef, useState } from "react";
import socket from "./socket";
import { useNavigate } from "react-router-dom";
import {
    startMedia,
    createCall,
    joinCall,
    hangUp,
    toggleMute
} from "../utils/videocallutils";
import { useLocation } from "react-router-dom";

function VideoCall() {
    const navigate = useNavigate();
    const location = useLocation();
    const { userId, callId, isDail } = location?.state || {};

    const [isMuted, setIsMuted] = useState(false);
    const [isCalling, setIsCalling] = useState(false);
    const [mediaError, setMediaError] = useState(null);

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const localStreamRef = useRef(null);

    // Caller: start call automatically
    useEffect(() => {
        const init = async () => {
            try {
                if (isDail) {
                    const { localStream } = await startMedia(localVideoRef.current);
                    localStreamRef.current = localStream;

                    await createCall(callId, userId, localStreamRef.current, remoteVideoRef.current);
                    setIsCalling(true);
                }
            } catch (err) {
                console.error("Caller media error:", err);
                setMediaError("Camera/mic error (maybe already in use or blocked).");
            }
        };
        init();
    }, [isDail, callId, userId]);

    useEffect(() => {
        const cutCall = (data) => {
            hangUp();
            console.log("Call ended by:", data);
            navigate("/chatroom");
            window.location.reload();
        }
        socket.on("end_call", cutCall);
        return () => {
            socket.off("end_call", cutCall);
        };
    }, [])

    // Receiver: only start media on button click
    const handleJoinCall = async () => {
        try {
            const { localStream } = await startMedia(localVideoRef.current);
            localStreamRef.current = localStream;

            await joinCall(callId, localStreamRef.current, remoteVideoRef.current);
            setIsCalling(true);
        } catch (err) {
            console.error("Join error:", err);
            setMediaError("Failed to access camera/mic. Is another tab using it?");
        }
    };

    async function handleHangUp() {
        try {
            socket.emit("end_call", callId)
            await hangUp(callId);
            navigate("/chatroom");
            window.location.reload();
        } catch (err) {
            console.error("Hang up error:", err);
        }
    };


    const handleMute = () => {
        const muted = toggleMute(localVideoRef.current);
        setIsMuted(muted);
    };

    return (
        <div className="flex flex-col items-center p-6 gap-4 bg-black min-h-screen">
            {mediaError && (
                <p className="text-red-500 text-sm">{mediaError}</p>
            )}
            <div className="flex gap-4">
                {!isDail && (
                    <button onClick={handleJoinCall} className="bg-blue-600 text-white px-4 py-1 rounded">
                        Join
                    </button>
                )}
                <button onClick={handleHangUp} className="bg-red-600 text-white px-4 py-1 rounded">
                    Hang Up
                </button>
                <button onClick={handleMute} className="bg-gray-600 text-white px-4 py-1 rounded">
                    {isMuted ? "Unmute" : "Mute"}
                </button>
            </div>
            <div className="flex gap-4 mt-4">
                <video ref={localVideoRef} autoPlay muted playsInline className="w-64 h-40 rounded shadow -scale-x-125 bg-black" />
                <video ref={remoteVideoRef} autoPlay playsInline className="w-64 h-40 rounded shadow bg-black" />
            </div>
        </div>
    );
}

export default VideoCall;

