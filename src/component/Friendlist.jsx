import React, { useEffect, useState } from 'react';
import axios from "axios";
import { friendlist_api, send_request_api, server_port, remove_friend } from './api';
import socket from './socket';
import Navbar from "./Navbar";
import { Link } from "react-router-dom";

const Friendlist = () => {
    const [friends, setFriends] = useState([]);
    const [load, setLoad] = useState(0);
    useEffect(() => {
        const getAll_friend = async () => {
            try {
                const res = await axios.get(friendlist_api, { withCredentials: true });
                setFriends(res.data.data);
            } catch (error) {
                console.log(error)
            }
        }
        getAll_friend();
    }, [load])

    const sendFriendRquest = async (receiverId) => {
        await axios.post(send_request_api, { receiverId }, { withCredentials: true });
    }

    const remove_user = (userId) => {
        axios.post(remove_friend, { userId }, { withCredentials: true })
    }

    return (
        <div className='text-white text-sm h-screen p-1'>
            <Navbar />
            {friends.map((data, index) => (
                <div className='flex justify-between items-center w-full sm:w-6/12 mx-auto rounded-md my-4 p-2 bg-indigo-950' key={index}>
                    <Link to={"/publicprofile"} state={{ id: data._id }} className='flex justify-around items-center gap-5'>
                        <img className='w-12 h-12  md:w-20 md:h-20 rounded-full' src={server_port + "/" + data.image} />
                        <h4>{data.name}</h4>
                    </Link>

                    <div className='flex justify-around items-center gap-2 sm:gap-4'>
                        <button className='capitalize' onClick={(() => {
                            remove_user(data._id)
                            setLoad(load + 1);
                        })}>remove</button>
                        <button className='capitalize' onClick={() => {
                            sendFriendRquest(data._id)
                            setLoad(load + 2);
                            socket.emit("__load_data__");
                        }}>add friend</button>
                    </div>
                </div>
            ))}</div>
    )
}

export default Friendlist;