// src/components/AudioCall.jsx
import React, { useEffect, useRef, useState } from "react";
import { startMedia, createCall, joinCall, hangUp, toggleMute } from "../utils/audioCallUtils";
import socket from "./socket"; // fixed import path
import { useLocation, useNavigate } from "react-router-dom";
import Animation from "./Animation";
import { Phone, PhoneOff, Mic, MicOff } from "lucide-react";
import Timer from "./Timer";

const AudioCall = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { callId, userId, role, isDail, info } = location?.state || {};
    const [isCallStart, setIsCallStart] = useState(false);
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
            await createCall(callId, userId, info, localStream, remoteAudioRef.current);
        } catch (err) {
            console.error("Call creation error:", err.message);
        }
    };

    async function joinCall__() {
        try {
            const { localStream } = await startMedia(localAudioRef.current);
            localStreamRef.current = localStream;
            await joinCall(callId, localStream, remoteAudioRef.current);
            socket.emit("join_call_a", userId);
            setIsCallStart(true);
        } catch (err) {
            console.error("Call join error:", err.message);
        }
    };

    const hangUpCall = () => {
        hangUp(callId);
        socket.emit("end_call_a", callId);
        navigate("/chatroom");
        window.location.reload();
    };

    useEffect(() => {
        const endHandler = (callId_) => {
            if (callId_ === callId) {
                hangUp(callId_);
                navigate("/chatroom");
                window.location.reload();
            }
        };
        socket.on("end_call_a", endHandler);
        return () => {
            socket.off("end_call_a", endHandler);
        };
    }, []);

    useEffect(() => {
        const joinHandler = (data) => {
            if (data === localStorage.getItem("userId")) {
                setIsCallStart(true);
            }
        };
        socket.on("join_call_a", joinHandler);
        return () => {
            socket.off("join_call_a", joinHandler);
        }
    }, []);

    return (
        <div className="h-screen">
            <div className="h-full flex flex-col items-center justify-center relative p-3 md:p-0 gap-2">
                <audio ref={localAudioRef} autoPlay muted />
                <audio ref={remoteAudioRef} autoPlay />
                <div className="w-full h-[65%] flex items-center justify-center relative ">
                    <Animation role={role} info={info} type={"call"} />
                </div>
                {isCallStart === true ?
                    <Timer isCallActive={isCallStart} /> : null}
                    
                <h1 id="collername" className="capitalize font-bold text-xl md:text-2xl bg-gradient-to-tr from-blue-600 via-green-600 to-red-700 bg-clip-text text-transparent">{role === "receiver" ? info?.name_ : localStorage.getItem("userName")}</h1>
                <div className="mt-4 flex gap-8 items-center justify-center">
                    <span onClick={joinCall__} className={`text-green-500 ${isDail ? "hidden" : ""} hover:border cursor-pointer p-1 rounded-lg hover:border-blue-500 duration-200`}>
                        <Phone />
                    </span>
                    <span
                        onClick={() => setMuted(toggleMute(localAudioRef.current))}
                        className=" hover:border cursor-pointer p-1 rounded-lg hover:border-blue-500 duration-200"
                    >
                        {muted ? <MicOff /> : <Mic />}
                    </span>
                    <span onClick={hangUpCall} className="text-red-500 hover:border cursor-pointer p-1 rounded-lg hover:border-blue-500 duration-200">
                        <PhoneOff />
                    </span>
                </div>

            </div>
        </div>
    );
};

export default AudioCall;
