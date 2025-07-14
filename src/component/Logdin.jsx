import React, { useState } from 'react'
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios';
import { Wind } from "lucide-react";
import { login_api } from './api';

const Logdin = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();
    const login = async () => {
        if (email.trim() && password.trim()) {
            localStorage.setItem("auth", true);
        }
        else { return }
        axios.post(login_api, { email, password }, { withCredentials: true });
        setTimeout(() => { navigate("/") }, 500);
    }
    return (
        <div className="w-full h-full flex justify-center items-center text-white">
            <div className="md:w-7/12 w-full md:p-0 px-4 overflow-hidden relative flex justify-center items-center h-screen" >
                <form >
                    <div className='text-center mb-3'><h3 className="bg-gradient-to-r text-3xl from-indigo-500 via-teal-400 to-blue-600 inline-block text-transparent bg-clip-text font-bold drop-shadow-xl capitalize">login</h3></div>
                    <input type="email" placeholder="email" onChange={(e) => { setEmail(e.target.value) }} value={email} required />
                    <input type="password" placeholder="password" onChange={(e) => { setPassword(e.target.value) }} value={password} required />
                    <div className='flex justify-between items-center'>
                        <div className='px-4 rounded-md bg-blue-600 py-1 flex items-center duration-150 gap-3 hover:gap-20 cursor-pointer' onClick={() => { login() }}>login<Wind /></div>
                        <span>if need to <span className='underline text-blue'><Link to={"/signup"}>Signup</Link></span></span>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default Logdin