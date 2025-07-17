import React from 'react'
import { server_port } from './api';
import { Mic } from 'lucide-react';
const Animation = ({ role = null, info = null, type = null }) => {
    return (
        <div id='animate_box' className={`w-full h-full flex justify-center items-center absolute z-50 backdrop-blur-xl ${type === "call" ? "backdrop-blur-none" : ""}`}>
            <span className={`${type === "call" ? "w-56 h-56" : "w-56 h-56 sm:w-60 sm:h-60 md:w-72 md:h-72 lg:w-80 lg:h-80"}`}></span>
            <span className={`${type === "call" ? "w-56 h-56" : "w-56 h-56 sm:w-60 sm:h-60 md:w-72 md:h-72 lg:w-80 lg:h-80"}`}></span>
            <span className={`${type === "call" ? "w-56 h-56" : "w-56 h-56 sm:w-60 sm:h-60 md:w-72 md:h-72 lg:w-80 lg:h-80"}`}></span>
            <span className={`${type === "call" ? "w-56 h-56" : "w-56 h-56 sm:w-60 sm:h-60 md:w-72 md:h-72 lg:w-80 lg:h-80"}`}></span>
            <span className={`${type === "call" ? "w-56 h-56" : "w-56 h-56 sm:w-60 sm:h-60 md:w-72 md:h-72 lg:w-80 lg:h-80"}`}></span>
            <span className={`${type === "call" ? "w-56 h-56" : "w-56 h-56 sm:w-60 sm:h-60 md:w-72 md:h-72 lg:w-80 lg:h-80"}`}></span>
            <span className={`${type === "call" ? "w-56 h-56" : "w-56 h-56 sm:w-60 sm:h-60 md:w-72 md:h-72 lg:w-80 lg:h-80"}`}></span>
            <span className={`${type === "call" ? "w-56 h-56" : "w-56 h-56 sm:w-60 sm:h-60 md:w-72 md:h-72 lg:w-80 lg:h-80"}`}></span>
            <span className={`${type === "call" ? "w-56 h-56" : "w-56 h-56 sm:w-60 sm:h-60 md:w-72 md:h-72 lg:w-80 lg:h-80"}`}></span>
            <span className={`${type === "call" ? "w-56 h-56" : "w-56 h-56 sm:w-60 sm:h-60 md:w-72 md:h-72 lg:w-80 lg:h-80"}`}></span>
            <span className={`${type === "call" ? "w-56 h-56" : "w-56 h-56 sm:w-60 sm:h-60 md:w-72 md:h-72 lg:w-80 lg:h-80"}`}></span>
            <span className={`${type === "call" ? "w-56 h-56" : "w-56 h-56 sm:w-60 sm:h-60 md:w-72 md:h-72 lg:w-80 lg:h-80"}`}></span>
            <div className='absolute z-10 w-32 h-32 rounded-full '>
                {type === "call" ? <img src={server_port + "/" + `${role === "receiver" ? info?.img : localStorage.getItem("userImage")}`} className={`w-full h-full rounded-full`} /> : <Mic className='w-full h-full text-white' />}
            </div>
        </div>
    )
}

export default Animation;