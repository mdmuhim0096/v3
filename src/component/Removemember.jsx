import React, { useState, useEffect } from 'react'
import axios from 'axios';
import { server_port } from './api';

const Removemember = () => {

    const [members, setMembers] = useState([]);
    const [load, setLoad] = useState(0);
    useEffect(() => {
        const getMembers = async () => {
            await axios.get(server_port + "/api/group/members/"+localStorage.getItem("groupId")).then(res => {
                setMembers(res.data.members);
            })
        }
        getMembers();

    }, [load])

    console.log(members)

    async function remove(userId){
        axios.post(server_port + "/api/group/removemember/" + localStorage.getItem("groupId"), {userId})
        setLoad(load + 1)
    }
    return (
        <div>{
            members.map((data, index) => (
                <div key={index}>
                   <div>
                    <img src={server_port + data.userId.image} />
                    <h4>{data.userId.name}</h4>
                    </div>
                    <button onClick={() =>{remove(data.userId._id)}}>remove</button>
                </div>
            ))
        }</div>
    )
}

export default Removemember