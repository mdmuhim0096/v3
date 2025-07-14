import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { joinCall, hangUp, createPeerConnection, startMedia } from "../utils/audiocallutils";
import { callId, server_port } from "../component/api";
import socket from './socket';
import { PhoneCall, PhoneOff, MoveUp, MoveDown } from "lucide-react";
import Timer from "./Timer";

const Audiocall = () => {
    const localAudioRef = useRef();
    const remoteAudioRef = useRef();
    const navigate = useNavigate();
    const Location = useLocation();
    const [isDail, setIsDail] = useState(Location?.state?.isDail);
    const [callStarted, setCallStarted] = useState(false);

    useEffect(() => {
        startMedia(localAudioRef.current, remoteAudioRef.current);
    }, []);

    const getTime = () => {
        const time = new Date();
        const actual_time = time.toLocaleTimeString();
        const date = time.toDateString();
        return { actual_time, date };
    }


    const handleHangUp = () => {
        hangUp(callId);
        setCallStarted(false);
        navigate("/chatroom")
        document.getElementById("calltone")?.pause();
        socket.emit("callend", localStorage.getItem("uniqueId_audio"));
        const riciver = localStorage.getItem("userId");
        const sender = localStorage.getItem("myId");
        const dateTime = getTime();
        const realtime = dateTime.date + " " + dateTime.actual_time;
        const data = { riciver, sender, message: "", realtime, call: {type: "audio", duration: localStorage.getItem("callduration")} };
        socket.emit("send_message", data);
        window.location.reload();
    }

    const handleJoinCall = () => {
        joinCall(callId);
        socket.emit("____recive_call____", localStorage.getItem("uniqueId_audio"))
        setCallStarted(true);
        document.getElementById("calltone")?.pause();
    };

    useEffect(() => {
        socket.on("callend", (data) => {
            if (data === localStorage.getItem("uniqueId_audio")) {
                hangUp(callId);
                navigate("/chatroom");
                document.getElementById("calltone")?.pause();
                window.location.reload();
            }
        })

        socket.on("____recive_call____", data => {
            if (data === localStorage.getItem("uniqueId_audio")) {
                setCallStarted(true)
            } else {
                setCallStarted(false)
            }
        })

    }, [])

    return (
        <div className='w-full h-screen relative flex flex-col gap-4 items-center'>
            <div className='w-full flex flex-col items-center h-auto   mx-auto py-4'>
                <div className='w-full h-auto flex flex-col gap-2 justify-center items-center'>
                    <img src={server_port + localStorage.getItem("collerImage")} className='w-32 h-32 rounded-full' />
                    <h4>{localStorage.getItem("collerName")}</h4>
                </div>
                <div className='w-full h-auto flex gap-2 justify-center py-6'>
                    <MoveUp className={`${isDail === true || isDail === "true" ?
                        "animate-bounce text-green-500" : ""
                        }`} />
                    <MoveDown className={`${!isDail === true || !isDail === "true" ?
                        "animate-bounce text-green-500" : ""}`} />
                </div>
                <div className='w-52 h-auto my-5  '>
                    <img src={server_port + `${isDail ? localStorage.getItem("myImage") : localStorage.getItem("collerImage")}`} className='w-10 h-10 rounded-full inline-block mx-3' />
                    <span>{isDail ? "you" : localStorage.getItem("collerName")} do this call</span>
                </div>
                <div className='w-full h-auto flex flex-col gap-2 justify-center items-center'>
                    <img src={server_port + localStorage.getItem("myImage")} className='w-32 h-32 rounded-full' />
                    <h4>{localStorage.getItem("myName")}</h4>
                </div>
                <Timer isCallActive={callStarted} />
            </div>
            <div className={`w-80 h-auto p-2 flex ${isDail === true || isDail === "true" ? "justify-center" : "justify-between"} items-center `} >
                <PhoneCall onClick={handleJoinCall} className={`text-green-500 cursor-pointer animate-bounce ${isDail === true || isDail === "true" ? "hidden" : ""}`} />
                <PhoneOff onClick={handleHangUp} className='text-red-500 cursor-pointer' />
            </div>
            <audio ref={localAudioRef}></audio>
            <audio ref={remoteAudioRef}></audio>
        </div>
    );
}

export default Audiocall;