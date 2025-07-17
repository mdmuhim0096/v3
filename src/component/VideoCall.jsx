
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
import { Phone, PhoneOff, Mic, MicOff } from "lucide-react";
import Timer from "./Timer";

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
            if (callId === data) {
                hangUp();
                navigate("/chatroom");
                window.location.reload();
            }
        }
        socket.on("end_call", cutCall);
        return () => {
            socket.off("end_call", cutCall);
        };
    }, []);

    useEffect(() => {
        const handleJoinCall = (data) => {
            if (callId === data) {
                setIsCalling(true);
            }
        };
        socket.on("join_call_v", handleJoinCall);
        return () => {
            socket.off("join_call_v", handleJoinCall);
        };
    }, [])

    // Receiver: only start media on button click //
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
        <div className="w-full h-screen flex justify-center items-center md:p-4">
            <div className="relative w-full h-full overflow-hidden flex flex-col items-center">
                <video ref={localVideoRef} autoPlay muted playsInline className="h-40 w-24 md:w-64 md:h-40 rounded shadow -scale-x-125 absolute object-fill z-20 top-0 md:left-9 left-3" />
                <video ref={remoteVideoRef} autoPlay playsInline className="object-fill w-full h-full absolute top-0 left-0" />

                <div className="absolute z-10 bottom-1">
                    {isCalling ? <h6 className="text-center mb-6">
                        <Timer isCallActive={isCalling} />
                    </h6> : null}

                    <div className="flex justify-center gap-6 ">
                        {!isDail && (
                            <span onClick={handleJoinCall} className="p-1 rounded-lg hover:border-blue-500 duration-200 cursor-pointer hover:border text-green-600">
                                <Phone />
                            </span>
                        )}
                        <span onClick={handleHangUp} className="p-1 rounded-lg hover:border-blue-500 duration-200 cursor-pointer hover:border text-red-500">
                            <PhoneOff />
                        </span>

                        <span onClick={handleMute} className="p-1 rounded-lg hover:border-blue-500 duration-200 cursor-pointer hover:border">
                            {isMuted ? <MicOff className="text-red-600" /> : <Mic className="text-blue-600" />}
                        </span>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default VideoCall;

