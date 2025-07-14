import React from 'react';
import { server_port } from './api';
import Navbar from "./Navbar";
import { useLocation, Link } from "react-router-dom";

const MutualFriend = () => {
    const friends = useLocation()?.state?.friends;

    return (<div className='w-full h-auto grid grid-cols-6 gap-7 py-5 px-2'>
        {Array.isArray(friends) && friends.map((data, index) => (
            <Link to={"/publicprofile"} state={{id: data._id}} key={index} className='w-full h-auto flex items-center justify-between border py-1 px-2 rounded-md hover:shadow-md hover:shadow-blue-500 hover:justify-center hover:gap-4' title='go and send friend requiest'>
                <img src={server_port + data.image} className='w-12 h-12 rounded-full'/>
                <h4>{data.name}</h4>
            </Link>
        ))}
    </div>)
}

export default MutualFriend;