import React, { useState, useEffect } from "react"
import Signup from "./component/Signup";
import Logdin from "./component/Logdin";
import Profile from "./component/Profile";
import Postform from "./component/Postform";
import Friendlist from "./component/Friendlist";
import Accepfriends from "./component/Accepfriends";
import ChatRoom from "./component/ChatRoom";
import Home from "./component/Home";
import Style from "./component/Style";
import Publicprofile from "./component/Publicprofile";
import axios from "axios";
import Notification from "./component/Notification";
import Get_post_by_notification from "./component/Get_post_by_notification";
import PublicVideo from "./component/PublicVideo";
import Save from "./component/Save";
import ProtectedRoute from "./component/ProtectedRoute";
import Settings from "./component/Settings";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import socket from "./component/socket";
import MutualFriend from "./component/MutualFriend";
import Groupsettings from "./component/Groupsettings";
import Share from "./component/Share";
import Removemember from "./component/Removemember";
import { server_port } from "./component/api";
import VideoCall from "./component/VideoCall";
import AudioCall from "./component/Audiocall";
import GroupVideoCall from "./component/GroupVideoCall";

const App = () => {
  const [styleSheet, setStyleSheet] = useState("");

  useEffect(() => {
    socket.emit("__load_data__");
    try {
      const mydata = async () => {
        const res = await axios.get(server_port + "/api/people/userStyle", { withCredentials: true })
        const data = res.data?.data?.styles;
        setStyleSheet(data)
      }
      mydata();
    } catch (err) {
      console.log(err);
    }
  }, [])

  return (
    <div className={`${styleSheet?.themebg} ${styleSheet?.textColor} ${styleSheet?.textStyle}`} >
      <BrowserRouter basename="/v3/">
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Logdin />} />
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/postform" element={<Postform />} />
          <Route path="/friends" element={<Friendlist />} />
          <Route path="/accepts" element={<Accepfriends />} />
          <Route path="/chatroom" element={<ChatRoom />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/publicprofile" element={<Publicprofile />} />
          <Route path="/style" element={<Style />} />
          <Route path="/notification" element={<Notification />} />
          <Route path="/get_post_by_notification" element={<Get_post_by_notification />} />
          <Route path="/publicVideo" element={<PublicVideo />} />
          <Route path="/save" element={<Save />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/mutualfriends" element={<MutualFriend />} />
          <Route path="/groupsettings" element={<Groupsettings />} />
          <Route path="/share" element={<Share />} />
          <Route path="/removeuser" element={<Removemember />} />
          <Route path="/v" element={<VideoCall />} />
          <Route path="/audiocall" element={<AudioCall />} />
          <Route path="/groupvideocall" element={<GroupVideoCall />} />
          <Route path="/*" element={<div className="text-white">Coming Soon!</div>} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App;