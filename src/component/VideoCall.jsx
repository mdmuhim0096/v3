import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PhoneCall, PhoneOff } from "lucide-react";
import socket from "./socket";
import axios from "axios";

import {
  startMedia, joinCall, hangUp, createPeerConnection
} from "../utils/videocallutils";
import { server_port } from "./api";
import { MoveUp, MoveDown } from "lucide-react";
import Timer from "./Timer";

function VideoCall() {
  const navigate = useNavigate();
  const location = useLocation();
  const callId = "kmdp340fko";
  const [isDail, setIsDail] = useState(location.state?.isDail)
  const [roomCreated, setRoomCreated] = useState(false);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [callStarted, setCallStarted] = useState(false);

  useEffect(() => {
    startMedia(localVideoRef.current, remoteVideoRef.current)
      .then(({ localStream, remoteStream }) => {
        createPeerConnection(callId, roomCreated);
      })
      .catch(err => alert(err.message));
  }, []);

  const getTime = () => {
    const time = new Date();
    const actual_time = time.toLocaleTimeString();
    const date = time.toDateString();
    return { actual_time, date };
  }

  const handleJoinCall = () => {
    joinCall(callId);
    socket.emit("____recive_call____", localStorage.getItem("uniqueId_audio"))
    setCallStarted(true);
    document.getElementById("calltone")?.pause();
  };

  const handleHangUp = () => {
    hangUp(callId);
    setRoomCreated(false);
    navigate("/chatroom");
    document.getElementById("calltone")?.pause();
    socket.emit("callend", localStorage.getItem("uniqueId"));
    const riciver = localStorage.getItem("userId");
    const sender = localStorage.getItem("myId");
    const dateTime = getTime();
    const realtime = dateTime.date + " " + dateTime.actual_time;
    const data = { riciver, sender, message: "", realtime, call: { type: "video", duration: localStorage.getItem("callduration") } };
    socket.emit("send_message", data);
    window.location.reload();
  };

  useEffect(() => {
    socket.on("callend", (data) => {
      if (data === localStorage.getItem("uniqueId")) {
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

  }, []);

  return (
    <div className="h-screen w-full  flex justify-between">
      <div id="callcontainer" className="w-3/12 h-auto p-2 flex gap-5  flex-col justify-between">
        <div>
          <div className="">
            <img className="w-36 h-36 rounded-full mx-auto" src={server_port + `${isDail ? localStorage.getItem("userImage") : localStorage.getItem("collerImage")}`} alt="" />
            <h5 className="text-center">{isDail ? localStorage.getItem("userName") : localStorage.getItem("collerName")}</h5>
          </div>
          <div className=" h-32 flex justify-between items-center">
            <div className="w-full  flex gap-4 items-center">
              <img className="w-10 h-10 rounded-full mx-auto" src={server_port + `${isDail ? localStorage.getItem("myImage") : localStorage.getItem("collerImage")}`} alt="" />
              <h4>{isDail ? "you" : localStorage.getItem("collerName")} made this call.</h4>
            </div>
            <div className="w-full flex justify-center items-center">
              <div><MoveUp size={32} strokeWidth={3} className={`${isDail ? "text-green-500 animate-bounce" : ""}`} /></div>
              <div><MoveDown size={32} strokeWidth={3} className={`${!isDail ? "text-green-500 animate-bounce" : ""}`} /></div>
            </div>
            <Timer isCallActive={callStarted} />
          </div>
          <div className="">
            <img className="w-36 h-36 rounded-full mx-auto" src={server_port + localStorage.getItem("myImage")} alt="" />
            <h5 className="text-center">you</h5>
          </div>
        </div>
        <div className=" flex justify-between items-center">
          <PhoneOff onClick={handleHangUp} className={`cursor-pointer text-red-600`} />
          <PhoneCall
            onClick={handleJoinCall}
            className={`${isDail === "true" || isDail === true ? "hidden" : "block"} cursor-pointer text-green-600`}
          />
        </div>
      </div>
      <div className="w-9/12 relative">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="w-40 h-48 rounded-md -scale-x-90 absolute right-0 top-2  object-fill"
        />
        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full rounded-xl object-fill border" />
      </div>

    </div>
  );
}

export default VideoCall;

