// import React, { useEffect, useRef, useState } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import { PhoneCall, PhoneOff } from "lucide-react";
// import socket from "./socket";
// import axios from "axios";

// import {
//   startMedia, joinCall, hangUp, createPeerConnection
// } from "../utils/videocallutils";
// import { server_port } from "./api";
// import { MoveUp, MoveDown } from "lucide-react";
// import Timer from "./Timer";

// function VideoCall() {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const callId = "kmdp340fko";
//   const [isDail, setIsDail] = useState(location.state?.isDail)
//   const [roomCreated, setRoomCreated] = useState(false);
//   const localVideoRef = useRef(null);
//   const remoteVideoRef = useRef(null);
//   const [callStarted, setCallStarted] = useState(false);
//   const [d, setd] = useState(false);

//   useEffect(() => {
//     startMedia(localVideoRef.current, remoteVideoRef.current)
//       .then(({ localStream, remoteStream }) => {
//         createPeerConnection(callId, roomCreated);
//       })
//       .catch(err => alert(err.message));
//   }, []);

//   const getTime = () => {
//     const time = new Date();
//     const actual_time = time.toLocaleTimeString();
//     const date = time.toDateString();
//     return { actual_time, date };
//   }

//   const handleJoinCall = () => {
//     joinCall(callId);
//     socket.emit("____recive_call____", localStorage.getItem("uniqueId_audio"))
//     setCallStarted(true);
//     document.getElementById("calltone")?.pause();
//   };

//   const handleHangUp = () => {
//     hangUp(callId);
//     setRoomCreated(false);
//     navigate("/chatroom");
//     document.getElementById("calltone")?.pause();
//     socket.emit("callend", localStorage.getItem("uniqueId"));
//     const riciver = localStorage.getItem("userId");
//     const sender = localStorage.getItem("myId");
//     const dateTime = getTime();
//     const realtime = dateTime.date + " " + dateTime.actual_time;
//     const data = { riciver, sender, message: "", realtime, call: { type: "video", duration: localStorage.getItem("callduration") } };
//     socket.emit("send_message", data);
//     window.location.reload();
//   };

//   useEffect(() => {
//     socket.on("callend", (data) => {
//       if (data === localStorage.getItem("uniqueId")) {
//         hangUp(callId);
//         navigate("/chatroom");
//         document.getElementById("calltone")?.pause();
//         window.location.reload();
//       }
//     })

//     socket.on("____recive_call____", data => {
//       if (data === localStorage.getItem("uniqueId_audio")) {
//         setCallStarted(true)
//       } else {
//         setCallStarted(false)
//       }
//     })

//   }, []);

//   return (
//     <div className="h-screen w-full  flex justify-between">
//       <div id="callcontainer" className="w-3/12 h-auto p-2 flex gap-5  flex-col justify-between">
//         <div>
//           <div className="">
//             <img className="w-36 h-36 rounded-full mx-auto" src={server_port + `${isDail ? localStorage.getItem("userImage") : localStorage.getItem("collerImage")}`} alt="" />
//             <h5 className="text-center">{isDail ? localStorage.getItem("userName") : localStorage.getItem("collerName")}</h5>
//           </div>
//           <div className=" h-32 flex justify-between items-center">
//             <div className="w-full  flex gap-4 items-center">
//               <img className="w-10 h-10 rounded-full mx-auto" src={server_port + `${isDail ? localStorage.getItem("myImage") : localStorage.getItem("collerImage")}`} alt="" />
//               <h4>{isDail ? "you" : localStorage.getItem("collerName")} made this call.</h4>
//             </div>
//             <div className="w-full flex justify-center items-center">
//               <div><MoveUp size={32} strokeWidth={3} className={`${isDail ? "text-green-500 animate-bounce" : ""}`} /></div>
//               <div><MoveDown size={32} strokeWidth={3} className={`${!isDail ? "text-green-500 animate-bounce" : ""}`} /></div>
//             </div>
//             <Timer isCallActive={callStarted} />
//           </div>
//           <div className="">
//             <img className="w-36 h-36 rounded-full mx-auto" src={server_port + localStorage.getItem("myImage")} alt="" />
//             <h5 className="text-center">you</h5>
//           </div>
//         </div>
//         <div className=" flex justify-between items-center">
//           <PhoneOff onClick={handleHangUp} className={`cursor-pointer text-red-600`} />
//           <PhoneCall
//             onClick={handleJoinCall}
//             className={`${isDail === "true" || isDail === true ? "hidden" : "block"} cursor-pointer text-green-600`}
//           />
//         </div>
//       </div>
//       <div className="w-9/12 relative bg-white">
//         <video
//           ref={localVideoRef}
//           autoPlay
//           muted
//           playsInline
//           className="w-40 h-48 rounded-md -scale-x-90 absolute right-0 top-2  object-fill border-2 border-red-500"
//         />
//         <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full rounded-xl object-fill border-2 border-green-500" />
//       </div>

//     </div>
//   );
// }

// export default VideoCall;

import React, { useEffect, useRef, useState } from "react";
import { database, ref, set, onValue, remove, push } from "./Firebase";
import socket from "./socket";
import { useLocation, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from 'uuid';
import { Phone, PhoneOff } from "lucide-react";

const servers = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
  ]
};

function VideoCall() {
  const navigate = useNavigate();

  const [mediaReady, setMediaReady] = useState(false);
  const [roomCreated, setRoomCreated] = useState(false);
  const [iscome, setIsCome] = useState(false);

  const pc = useRef(null);
  const localStream = useRef(null);
  const remoteStream = useRef(new MediaStream());
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);

  const userId = localStorage.getItem("userId"), myId = localStorage.getItem("myId"),
    isDail = useLocation()?.state?.dail;
  const callId = "11";
  // Initialize camera and mic
  useEffect(() => {

    console.log(callId, "  call id");
    const getMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStream.current = stream;
        localVideo.current.srcObject = stream;
        remoteVideo.current.srcObject = remoteStream.current;
        setMediaReady(true);
        socket.emit("____incoming_call____", { userId, callId });
      } catch (err) {
        console.error("Media error:", err);
        alert("Please allow camera and mic access.");
      }
    };

    getMedia();
  }, []);

  // Create peer connection
  const createPeerConnection = () => {
    pc.current = new RTCPeerConnection(servers);

    if(localStream.current){
      localStream.current.getTracks().forEach(track => {
      pc.current.addTrack(track, localStream.current);
    });

    }
    pc.current.ontrack = event => {
      event.streams[0].getTracks().forEach(track => {
        remoteStream.current.addTrack(track);
      });
    };

    pc.current.onicecandidate = event => {
      if (event.candidate) {
        const candidatePath = `calls/${callId}/candidates/${roomCreated ? "offer" : "answer"}`;
        const candidateRef = ref(database, candidatePath);
        const newCandidate = push(candidateRef);
        set(newCandidate, event.candidate.toJSON());
      }
    };
  };

  // Create call (offer side)
  const createCall = async () => {
    if (!mediaReady || !callId) return alert("Set call ID and wait for media.");

    createPeerConnection();
    setRoomCreated(true);

    const offer = await pc.current.createOffer();
    await pc.current.setLocalDescription(offer);
    await set(ref(database, `calls/${callId}/offer`), offer);

    // Listen for answer
    onValue(ref(database, `calls/${callId}/answer`), async snapshot => {
      const data = snapshot.val();
      if (data && !pc.current.currentRemoteDescription) {
        const answerDesc = new RTCSessionDescription(data);
        await pc.current.setRemoteDescription(answerDesc);
      }
    });

    useEffect(() => {
      if (isDail) {
        createCall();
      }
    }, [])

    // Listen for remote candidates (answer side)
    onValue(ref(database, `calls/${callId}/candidates/answer`), snapshot => {
      const candidates = snapshot.val();
      if (candidates) {
        Object.values(candidates).forEach(async candidate => {
          await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
        });
      }
    });
  };

  // Join call (answer side)
  const joinCall = async () => {
    const __call_id___ = localStorage.getItem("callId__");
    if (!__call_id___.trim()) {
      return alert("Set call ID and wait for media.");
    } else {
      setIsCome(true);
    }

    createPeerConnection();

    const callRef = ref(database, `calls/${__call_id___}`);
    onValue(callRef, async snapshot => {
      const data = snapshot.val();
      if (!data?.offer) return;

      await pc.current.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await pc.current.createAnswer();
      await pc.current.setLocalDescription(answer);
      await set(ref(database, `calls/${__call_id___}/answer`), answer);
    });

    // Listen for offer ICE candidates
    onValue(ref(database, `calls/${__call_id___}/candidates/offer`), snapshot => {
      const candidates = snapshot.val();
      if (candidates) {
        Object.values(candidates).forEach(async candidate => {
          await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
        });
      }
    });
  };

  // End call
  const hangUp = async () => {
    if (pc.current) {
      pc.current.close();
      pc.current = null;
    }

    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
    }

    await remove(ref(database, `calls/${callId}`));
    setRoomCreated(false);
    setMediaReady(false);

    socket.emit("callend", callId);
    navigate("/chatroom");
    window.location.reload();
  };

  useEffect(() => {
    const endCall = (i) => {
      if(i === localStorage.getItem("callId__") || i === localStorage.getItem("userId")){
        hangUp();
      }
    }
    socket.on("callend", endCall);
    return () => {
      socket.off("callend", endCall)
    }
  }, [])

  return (
    <div style={{ textAlign: "center" }}>
      <br />
      <div>
        <button onClick={joinCall} className={`${isDail ? "hidden" : ""}`}>
          <Phone className="text-green-600" />
        </button>
        <button onClick={hangUp}>
          <PhoneOff className="text-red-600" />
        </button>
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
        <video ref={localVideo} autoPlay muted playsInline style={{ width: 300, marginRight: 20 }} />
        <video ref={remoteVideo} autoPlay playsInline style={{ width: 300, border: iscome ? "2px solid lime" : "2px solid red" }} />
      </div>
    </div>
  );
}

export default VideoCall;
