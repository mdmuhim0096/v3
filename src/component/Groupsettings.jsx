import React, { useEffect } from 'react'
import axios from 'axios';
import { Plus } from "lucide-react"
import { useLocation } from "react-router-dom";
import { server_port } from './api';

const Groupsettings = () => {
    const friends = useLocation()?.state.friends;

    const add = (members) => {
        axios.post(server_port + "/api/group/addmember/"+localStorage.getItem("groupId"), {members});
    }

    return (
        <div>{friends.map((data, index) => (
            <div key={index} onClick={() => {add(data._id)}} className='cursor-pointer'>{data._id}</div>
        ))}</div>
    )
}

export default Groupsettings;