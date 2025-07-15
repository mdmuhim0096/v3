import React, { useState, useEffect, useRef } from 'react'
import axios from "axios";
import color from './color';
import { ArrowLeft, RotateCcw, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ToggleBtn from "./ToggleBtn";
import { ToastContainer, toast } from "react-toastify"
import { server_port } from './api';

const Settings = () => {

    const navigate = useNavigate();

    const fontFamilyArray = ["font-sans", "font-serif", "font-mono", "font-inter", "font-roboto", "font-poppins", "font-open-sans", "font-lato", "font-ubuntu", "font-josefin", "font-raleway"];

    const myDBid = () => localStorage.getItem("myId");

    const doChangeTextColor = (color) => {
        const id = myDBid();
        const myColor = color.split("-");
        myColor[0] = "text";
        const textColor = myColor.join("-");
        axios.post(server_port + "/api/people/textcolor", { textColor, id });
        location.reload();
    }

    const doChangeBGColor = (themebg) => {
        const id = myDBid();
        axios.post(server_port + "/api/people/themebg", { themebg, id });
        location.reload();
    }

    const doChangeTextStyle = (textStyle) => {
        const id = myDBid();
        axios.post(server_port + "/api/people/textstyle", { textStyle, id });
        location.reload();
    }

    const doChangePostBg = (postbg) => {
        const id = myDBid();
        axios.post(server_port + "/api/people/postbg", { postbg, id });
        location.reload();
    }

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [_newPassword_, setNewPassword_] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [isLoad, setIsLoad] = useState(false);
    const [isNew, setIsNew] = useState(false);
    const getPermision = async () => {
        setIsLoad(true)
        try {
            axios.post(server_port + "/api/people/checkauth", { email, password })
                .then(res => {
                    setIsLoad(false);
                    toast.success("yes " + res.data.message.toLowerCase());
                    setIsNew(res.data.success);
                }).catch(err => {
                    setIsLoad(false);
                    toast(err.response?.data.message, err.response?.data.success);
                })
        } catch (err) {
            console.log(err);
        }
    }

    const restpassword = () => {
        if (_newPassword_ !== newPassword) {
            return toast.warn("please type same value in inputs");
        }

        setIsLoad(true);

        try {
            axios.post(server_port + "/api/people/restpassword", { password: _newPassword_ }, { withCredentials: true })
                .then(res => {
                    setIsLoad(false);
                    toast.success("yes " + res.data.message.toLowerCase());
                }).catch(err => {
                    setIsLoad(false);
                    toast(err.response?.data.message, err.response?.data.success);
                })
        } catch (err) {
            console.log(err);
        }
    }

    const [isActive, setIsActive] = useState(localStorage.getItem("activeStatus"));
    const [load, setLoad] = useState(0);
    useEffect(() => {
        const getStatus = async () => {
            const res = await axios.get(server_port + "/api/people/userData", { withCredentials: true });
            localStorage.setItem("activeStatus", res.data.data.isActive);
            setIsActive(res.data.data.isActive);
        }
        getStatus();
    }, [load])

    const handelStatus = () => {
        setLoad(load + 1);
        const userId = myDBid();
        axios.post(server_port +`/api/people/${isActive ? "dactiveuser" : "activeuser"}`, { userId });
        localStorage.setItem("isTurn", isActive ? false : true)
    }

    return (
        <div className='p-4 h-screen overflow-y-auto'>
            <ToastContainer />
            <ArrowLeft onClick={() => { navigate("/") }} className='cursor-pointer' />
            <div className='my-6'>{fontFamilyArray.map((family, index) => (<span key={index} onClick={() => { doChangeTextStyle(family) }} className='inline-block mx-3 duration-200 hover:bg-slate-800 cursor-pointer hover:scale-110 hover:shadow-md px-2 py-1 my-2 rounded-xl'>{family}</span>))}</div>
            <hr />
            <h3 className='capitalize'>text color</h3>
            <div className={`w-full h-52 overflow-x-auto flex`}>{color.map((colors, index) => (
                <div key={index} className={`w-full h-40 my-3 mx-2 rounded-lg ${colors}`}
                    onClick={() => { doChangeTextColor(colors) }}
                >
                    <div className={`w-52 h-full`}></div>
                </div>
            ))}</div>
            <hr />
            <h3 className='capitalize'>background color</h3>
            <div className={`w-full h-52 overflow-x-auto flex`}>{color.map((colors, index) => (
                <div key={index} className={`w-full h-40 my-3 mx-2 rounded-lg ${colors}`}
                    onClick={() => { doChangeBGColor(colors) }}
                >
                    <div className={`w-52 h-full`}></div>
                </div>
            ))}</div>

            <hr />
            <h3 className='capitalize'>post module color</h3>
            <div className={`w-full h-52 overflow-x-auto flex`}>{color.map((colors, index) => (
                <div key={index} className={`w-full h-40 my-3 mx-2 rounded-lg ${colors}`}
                    onClick={() => { doChangePostBg(colors) }}
                >
                    <div className={`w-52 h-full`}></div>
                </div>
            ))}</div>
            <hr />
            <div className='flex flex-col sm:flex-row capitalize justify-between sm:p-2 gap-5'>
                <div onClick={() => { handelStatus() }} className='flex capitalize gap-5 w-full sm:w-6/12 sm:border-r'>active status <ToggleBtn condition={isActive} />
                </div>
                <hr className='sm:hidden' />
                <div className='sm:w-6/12 w-full p-2'>
                    <h4 className='flex gap-10 my-6 justify-between'>reset password <RotateCcw className='animate-spin duration-500' style={{ animationDirection: "reverse" }} /></h4>
                    <div className={`${isNew ? "hidden" : "block"}`}>
                        <input type="email" required placeholder='enter your email' value={email} onChange={(e) => { setEmail(e.target.value) }} />
                        <input type="password" required placeholder='enter your old password' value={password} onChange={(e) => { setPassword(e.target.value) }} />
                        <div className='w-full text-center my-4 rounded-md cursor-pointer bg-green-500 py-2 hover:bg-green-600 shadow-md' onClick={() => { getPermision() }}><span className="mx-5">submit</span> <Loader className={`animate-spin mx-3 ${isLoad ? "inline" : "hidden"}`} /></div>
                    </div>
                    <div className={`${isNew ? "block" : "hidden"}`}>
                        <input type="text" required placeholder='new password' value={_newPassword_} onChange={(e) => { setNewPassword_(e.target.value) }} />
                        <input type="text" required placeholder='confirm password' value={newPassword} onChange={(e) => { setNewPassword(e.target.value) }} />
                        <div className='w-full text-center my-4 rounded-md cursor-pointer bg-green-500 py-2 hover:bg-green-600 shadow-md' onClick={() => { restpassword() }}><span className="mx-5">reset</span> <Loader className={`animate-spin mx-3 ${isLoad ? "inline" : "hidden"}`} /></div>
                    </div>
                </div>

            </div>
        </div>
    )
}

export default Settings;