import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from "react-router-dom";
import { server_port } from './api';
import axios from 'axios';


const Share = () => {
    const friends = useLocation().state?.friends, postId = useLocation().state?.post;
    const [Groups, setGroup] = useState([]);

    useEffect(() => {

        const get_my_groups = async () => {
            try {
                const res = await axios.get(server_port + "/api/group/myGroup/" + localStorage.getItem("myId"));
                setGroup(res.data.groups.groups)
            } catch (error) {
                console.log(error);
            }
        }
        get_my_groups();

    }, []);

    const navigate = useNavigate();
    const getTime = () => {
        const time = new Date();
        const actual_time = time.toLocaleTimeString();
        const date = time.toDateString();
        return { actual_time, date };
    }
    const createChatShare = (recevireId, shareId) => {
        const dateTime = getTime();
        const realTime = dateTime.date + " " + dateTime.actual_time;
        const myId = localStorage.getItem("myId");
        axios.post(server_port + "/api/share/sharechat", { senderId: myId, shareId, recevireId, user: myId, realTime });
    }

    const createGroupShare = (shareId, group) => {
        const dateTime = getTime();
        const realTime = dateTime.date + " " + dateTime.actual_time;
        const myId = localStorage.getItem("myId");
        axios.post(server_port + "/api/share/sharegroup", { sender: myId, realTime, shareId, group, messageType: "share" });
    }

    return (
        <div>
            <div className='flex items-center justify-around flex-wrap'>
                {
                    friends.map((data, index) => (
                        <div key={index} className='flex items-center justify-between border p-1 rounded-md'>
                            <div className='flex items-center justify-between gap-3'>
                                <img src={server_port + data.image} className='w-12 h-12 rounded-full' />
                                <h5>{data.name}</h5>
                            </div>
                            <div className='ml-7 px-3 bg-blue-500 rounded-md cursor-pointer flex items-center justify-center pb-1' onClick={() => { createChatShare(data._id, postId) }}>send</div>
                        </div>
                    ))
                }
            </div>

            <h3>groups</h3>

            {
                Groups.map((data, index) => (
                    <div key={index}>
                        <div>
                            <img src={server_port + "/" + data.groupImage} alt="" />
                            <h4>{data.name}</h4>
                        </div>
                        <div className='ml-7 px-3 bg-blue-500 rounded-md cursor-pointer flex items-center justify-center pb-1' onClick={() => { createGroupShare(postId, data._id) }}>send</div>
                    </div>
                ))
            }

            <div onClick={() => { navigate("/") }} className='px-4 rounded-md bg-blue-500 cursor-pointer py-1'>return</div>
        </div>
    )
}

export default Share;