// src/components/GroupVideoCall.jsx
import React, { useEffect, useRef, useState } from "react";
import {
    startMedia,
    createCall,
    receiveCall,
    hangUp,
    toggleMute,
    listenForAnswers,
    listenForCandidates
} from "../utils/groupVideoCallUtils";
import { useLocation, useNavigate } from "react-router-dom";

const GroupVideoCall = () => {
    const { roomId, userId, isCaller } = useLocation()?.state;
    const localRef = useRef();
    const [remoteStreams, setRemoteStreams] = useState({});
    const [muted, setMuted] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            const stream = await startMedia();
            if (localRef.current) {
                localRef.current.srcObject = stream;
            }

            if (isCaller) {
                await createCall(roomId, userId);
                listenForAnswers(roomId, userId);
                listenForCandidates(roomId, userId);
            }
        })();

    }, []);

    const handleReceive = () => {
        receiveCall(roomId, "caller-id", userId, (stream, id) => {
            setRemoteStreams(prev => ({ ...prev, [id]: stream }));
        });
        listenForCandidates(roomId, userId);
    };

    const handleMute = () => {
        const isNowMuted = toggleMute();
        setMuted(isNowMuted);
    };

    function hangUpCall() {
        hangUp(roomId);
        navigate("/chatroom");
        window.location.reload();
    };

    return (
        <div>
            <h2>Room: {roomId}</h2>
            <div>
                <video ref={localRef} autoPlay muted playsInline style={{ width: 200 }} />
                {Object.entries(remoteStreams).map(([uid, stream]) => (
                    <video
                        key={uid}
                        autoPlay
                        playsInline
                        srcObject={stream}
                        style={{ width: 200 }}
                        ref={el => {
                            if (el) el.srcObject = stream;
                        }}
                    />
                ))}
            </div>
            {!isCaller && <button onClick={handleReceive}>📞 Receive Call</button>}
            <button onClick={handleMute}>{muted ? "🔇 Unmute" : "🔊 Mute"}</button>
            <button onClick={() => hangUpCall()}>❌ Hang Up</button>
        </div>
    );
};

export default GroupVideoCall;
