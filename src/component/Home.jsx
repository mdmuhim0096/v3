import React, { useEffect, useState, Suspense, lazy } from 'react';
import axios from 'axios';
import Navbar from './Navbar';
import socket from './socket';
import SearchBar from './SearchBar';
import { logout_api, server_port } from './api';
import { simpleInfo_api } from './api';
import { ArrowUp, ArrowDown, ClipboardList, LayoutDashboard, LogOut, CalendarPlus, Settings, X, AlignLeft } from "lucide-react";
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { active } from "../utils/utils"

const LazyComponent = lazy(() => import("./PublicPost"));

let postLength = 0;
export const submitLength = (l) => {
    postLength = l;
}

const Home = () => {
    const navigate = useNavigate();
    useEffect(() => {
        socket.emit("__load_data__");
        const getdata = async () => {
            try {
                const res = await axios.get("https://node-v1-tc13.onrender.com/api/people/userData", { withCredentials: true });
                const data = res.data.data;
                socket.emit("register", data._id);
                localStorage.setItem("myId", data._id);
                localStorage.setItem("myImage", data.image);
            } catch (error) {
                console.log(error);
            }
        }
        getdata();

    }, [])

    useEffect(() => {
        const handleIncomingCall = (data) => {
            if (data === localStorage.getItem("myId")) {
                document.getElementById("calltone")?.play();
                localStorage.setItem("riciver", localStorage.getItem("userId"))
                navigate("/videocall");
            }
        };
        socket.on("incoming_call", handleIncomingCall);
        return () => {
            socket.off("incoming_call", handleIncomingCall);
        };
    }, [socket, navigate]);
    const [progileName, setProfileName] = useState("");
    const [profileImage, setProfileImage] = useState("");
    const [scrollDown, setScrollDown] = useState(null);

    useEffect(() => {
        const simpleInfo = async () => {
            const res = await axios.get(simpleInfo_api, { withCredentials: true });
            setProfileImage(res.data.data.image);
            setProfileName(res.data.data.name);
        }
        simpleInfo();
        active();
    }, []);

    const handleBeforeUnload = () => {
        const url = "https://node-v1-tc13.onrender.com/api/people/dactiveuser";
        const data = JSON.stringify({ userId });
        const blob = new Blob([data], { type: 'application/json' });
        navigator.sendBeacon(url, blob);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    const goToBottom = () => {
        const chat_container = document.getElementById("postcontainer");
        chat_container.scrollTo({ top: chat_container.scrollHeight })
    }

    useEffect(() => {
        const containerHeigh = document.getElementById("postcontainer");
        containerHeigh.onscroll = () => {
            containerHeigh.scrollTop === 0 ? setScrollDown(true) : setScrollDown(false);
        }
    }, []);

    const logOut = async () => {
        localStorage.setItem("auth", false);
        await axios.post(logout_api, { data: null }, { withCredentials: true });
        location.reload();
    }

    const [isBar, setIsBar] = useState(false);

    return (
        <div className='relative h-screen overflow-hidden'>
            <div className='w-full sm:flex sm:items-center sm:justify-between sticky top-0 sm:px-2 pb-2'>
                <SearchBar />
                <Navbar />
            </div>
            <div className='w-full flex justify-between overflow-x-hidden'>
                <AlignLeft className='sm:hidden absolute z-40 w-7 h-7 rounded-md backdrop-blur-md' onClick={() => { setIsBar(true) }} />
                <ul className={`w-full sm:w-5/12 p-2 h-[89vh] overflow-y-auto z-50 ${isBar ? "block fixed backdrop-blur-md" : "hidden"} sm:block`}>
                    <X className='float-right cursor-pointer mb-5 sm:hidden' onClick={() => { setIsBar(false) }} />
                    <li className='py-0 justify-start gap-3 mb-7' onClick={() => { navigate("/profile") }}>
                        <img className='w-12 h-12 rounded-full border' src={server_port + profileImage} />
                        <h4>{progileName}</h4>
                    </li>

                    <Link to={"/postform"}><li><CalendarPlus />make a post</li></Link>
                    <Link to={"/save"}><li><ClipboardList /> save</li></Link>
                    <Link to={"/"}><li><LayoutDashboard />Dashboard</li></Link>
                    <Link to={"/settings"}><li><Settings />settings</li></Link>
                    <Link to={"/"} onClick={() => { logOut() }}><li><LogOut />Log out</li></Link>
                </ul>
                <ul className="w-full h-[88vh] overflow-y-auto relative scroll-smoothm" id='postcontainer'>
                    <Suspense fallback={<div>Loading...</div>} ><LazyComponent /></Suspense>
                    <div id='toTopBtn' className={`cursor-pointer w-10 h-10 bg-blue-500 rounded-md flex justify-center items-center text-white sticky bottom-2 sm:bottom-4 sm:left-5 ${postLength <= 1.6 ? "hidden" : ""}`} onClick={() => {
                        const containerHeight = document.getElementById("postcontainer");
                        scrollDown ? goToBottom() :
                            containerHeight.scrollTop = 0;
                    }}>
                        {scrollDown ? <ArrowDown /> : <ArrowUp />}
                    </div>
                </ul>
                <ul className="w-5/12 p-2 h-[89vh] overflow-y-auto hidden sm:block"></ul>
            </div>
        </div>
    )
}

export default Home;
