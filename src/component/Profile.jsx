import React, { useEffect, useState } from 'react'
import axios from "axios"
import { server_port } from './api';
import Mypost from './Mypost';
import { ArrowLeft, Ellipsis, Pencil, X, ImagePlus } from "lucide-react";
import { Link } from "react-router-dom";
import Seemore from './Seemore';

const Profile = () => {

    const [load, setLoad] = useState(0);
    const [user, setUser] = useState("");
    useEffect(() => {
        const getdata = async () => {
            try {
                const res = await axios.get(server_port + "/api/people/userData", { withCredentials: true });
                const data = res.data.data;
                setUser(res.data.data);
                localStorage.setItem("myId", data._id);
                localStorage.setItem("myImage", data.image);
            } catch (error) {
                console.log(error);
            }
        }
        getdata();
    }, [load]);

    const [isBio, setIsBio] = useState(false);
    const [bio, setBio] = useState("");
    const [file, setFile] = useState(null);
    const [name, setName] = useState("");
    const [x, setx] = useState(false);
    const [y, sety] = useState(false);
    const [a, seta] = useState(false);
    const [b, setb] = useState(false);
    const [c, setc] = useState(false);
    const [d, setd] = useState(false);
    const [email, setemail] = useState("");
    const [age, setage] = useState("");
    const [gender, setgender] = useState("");
    const [maritalStatus, setmaritalStatus] = useState("");

    const addBio = (e) => {
        axios.post(server_port + "/api/people/addbio", { bio: e }, { withCredentials: true })
        setIsBio(false)
        setTimeout(() => { setLoad(load + 1) }, 200)
    }

    const updateProfileImage = async () => {
        const fd = new FormData();
        fd.append("img", file)
        axios.post(server_port + "/api/people/updateProfileImage", fd, { withCredentials: true });
        setx(false);
        setLoad(load + 1);
    }

    const updateProfileName = async () => {
        axios.post(server_port + "/api/people/updateProfileName", { name }, { withCredentials: true });
        sety(false);
        setLoad(load + 1);
    }


    const updateProfileEmail = async () => {
        axios.post(server_port + "/api/people/updateProfileEmail", { email }, { withCredentials: true });
        seta(false);
        setLoad(load + 1);
    }

    const updateProfileGender = async () => {
        axios.post(server_port + "/api/people/updateProfileGender", { gender }, { withCredentials: true });
        setb(false);
        setLoad(load + 1);
    }

    const updateProfileAge = async () => {
        axios.post(server_port + "/api/people/updateProfileAge", { age }, { withCredentials: true });
        setc(false);
        setLoad(load + 1);
    }

    const updateProfileMaritaStatus = async () => {
        axios.post(server_port + "/api/people/updateProfileMaritaStatus", { maritalStatus }, { withCredentials: true });
        setd(false);
        setLoad(load + 1);
    }


    return (
        <section className='text-white'>
            <div className={`w-full h-screen backdrop-blur-md fixed z-50 top-0 left-0 flex justify-center items-center ${isBio ? "flex" : "hidden"}`}>
                <div className='w-full h-full md:w-6/12 md:h-3/4 rounded-md bg-slate-700 p-2'>
                    <textarea name='bio' className='w-full h-5/6 resize-none' placeholder='Add bio'
                        onChange={(e) => { setBio(e.target.value) }} value={bio}></textarea>
                    <span className='flex justify-between items-center mt-4'>
                        <button onClick={() => { setIsBio(false) }}>close</button>
                        <button onClick={() => { addBio(bio) }}>add</button>
                    </span>
                </div>
            </div>
            <div className='w-full sticky top-0 left-0 z-40'>
                <Link to={"/"}><ArrowLeft /></Link>
            </div>
            <div className={`w-full h-full overflow-hidden flex justify-center items-center`}>
                <div className='w-full h-64 relative overflow-hidden'>
                    <img className='object-fill w-full h-full' src={server_port + "/" + user.image} title='cover image' />
                    <img src={server_port + "/" + user.image} className='w-24 h-2w-24 border-2 rounded-full absolute bottom-0 left-0' title='profile image' />
                    <div className={`absolute top-0 left-0 flex justify-center items-center p-5 w-full h-full bg-slate-900 z-50 flex-col ${x ? "block" : "hidden"}`}>
                        <X  className='absolute top-2 right-2' onClick={() => {setx(false)}}/>
                        <div className='w-auto border flex justify-center items-center bg-gradient-to-r from-emerald-400 to-cyan-400 p-2 rounded-md'>
                            <input type="file" className='absolute w-10 opacity-0' onChange={(e) => { setFile(e.target.files[0]) }} />
                                <ImagePlus />
                        </div>
                        <button className='my-3' onClick={() => { updateProfileImage() }}>update</button>
                    </div>
                    <div onClick={() => { setx(true) }} className='w-10 h-10 rounded-full bg-slate-600 absolute bottom-10 left-20 flex justify-center items-center'>
                        <Pencil />
                    </div>
                </div>
            </div>
            <div className='h-auto flex justify-between items-start md:items-center p-1 md:p-4 flex-col gap-2'>
                <div className='flex items-center justify-center gap-5 mt-2'>
                    <h4 className='text-2xl md:text-5xl font-semibold'>{user.name}</h4>
                    <span onClick={() => { sety(true); setName(user.name) }} className={`border-2 bg-slate-600 rounded-full w-10 h-10 flex justify-center items-center p-1 ${!y ? "block" : "hidden"}`}>
                        <Pencil />
                    </span>
                    <div className={`gap-5 ${y ? "flex" : "hidden"}`}>
                        <input type="text" className='w-5/12' value={name} onChange={(e) => { setName(e.target.value) }} />
                        <button onClick={() => { updateProfileName() }} className='text-center'>update</button>
                        <X onClick={() => { sety(false) }} />
                    </div>
                </div>
                <div>
                    <h1>Likes: {user.like}</h1>
                </div>
            </div>
            <span className='md:p-4 block w-full'>
                <hr className='w-full h-[2px] bg-indigo-900 my-5 border-none' />
            </span>
            <div className='grid md:grid-cols-2 lg:grid-cols-3 my-5 gap-5 md:p-4'>
                <div className='p-[3px] border w-full max-h-auto rounded-lg bg-gradient-to-r from-green-400 to-blue-500 flex justify-center items-center'>
                    <div className='bg-slate-800 h-full max-h-auto w-full rounded-md p-1'>
                        <div className='flex items-center justify-start'>
                            <h4 className=''>Email:- {user.email}</h4>
                            <span onClick={() => { seta(true); setemail(user.email) }} className={`border-2 bg-slate-600 rounded-full w-5 h-5 flex justify-center items-center p-1 mx-3 ${!a ? "block" : "hidden"}`}>
                                <Pencil />
                            </span>
                            <div className={`gap-5 ${a ? "flex" : "hidden"}`}>
                                <input type="text" className='w-5/12' value={email} onChange={(e) => { setemail(e.target.value) }} />
                                <button onClick={() => { updateProfileEmail() }} className='text-center'>update</button>
                                <X onClick={() => { seta(false) }} />
                            </div>
                        </div>
                        <div className='flex items-center justify-start'>
                            <h4 className=''>Age:- {user.age}</h4>
                            <span onClick={() => { setb(true); setage(user.age) }} className={`border-2 bg-slate-600 rounded-full w-5 h-5 flex justify-center items-center p-1 mx-3 ${!b ? "block" : "hidden"}`}>
                                <Pencil />
                            </span>
                            <div className={`gap-5 ${b ? "flex" : "hidden"}`}>
                                <input type="number" className='w-5/12' value={age} onChange={(e) => { setage(e.target.value) }} />
                                <button onClick={() => { updateProfileAge() }} className='text-center'>update</button>
                                <X onClick={() => { setb(false) }} />
                            </div>
                        </div>
                        <div className='flex items-center justify-start'>
                            <h4 className=''>Gender:- {user.gender}</h4>
                            <span onClick={() => { setc(true); setgender(user.gender) }} className={`border-2 bg-slate-600 rounded-full w-5 h-5 flex justify-center items-center p-1 mx-3 ${!c ? "block" : "hidden"}`}>
                                <Pencil />
                            </span>
                            <div className={`gap-5 ${c ? "flex" : "hidden"}`}>
                                <input type="text" className='w-5/12' value={gender} onChange={(e) => { setgender(e.target.value) }} />
                                <button onClick={() => { updateProfileGender() }} className='text-center'>update</button>
                                <X onClick={() => { setc(false) }} />
                            </div>
                        </div>
                        <div className='flex items-center justify-start'>
                            <h4 className=''>Marital status:- {user.maritalStatus}</h4>
                            <span onClick={() => { setd(true); setmaritalStatus(user.maritalStatus) }} className={`border-2 bg-slate-600 rounded-full w-5 h-5 flex justify-center items-center p-1 mx-3 ${!d ? "block" : "hidden"}`}>
                                <Pencil />
                            </span>
                            <div className={`gap-5 ${d ? "flex" : "hidden"}`}>
                                <input type="text" className='w-5/12' value={maritalStatus} onChange={(e) => { setmaritalStatus(e.target.value) }} />
                                <button onClick={() => { updateProfileMaritaStatus() }} className='text-center'>update</button>
                                <X onClick={() => { setd(false) }} />
                            </div>
                        </div>
                    </div>
                </div>
                <div className='p-[3px] border w-full h-[111.5px] rounded-lg bg-gradient-to-r from-green-400 to-blue-500 flex justify-center items-center'>
                    <div className='bg-slate-800 h-full w-full rounded-md p-1'>
                        <h1>Friends</h1>
                        <div className='my-3 flex justify-start items-center'>{user.friends?.map((data, index) => (
                            <img key={index} className={`w-5 h-5 rounded-full ${index > 0 ? "-ml-2" : ""}`} src={server_port + "/" + data.image} />
                        ))}</div>
                    </div>
                </div>
                <div className='p-[3px] border w-full rounded-lg bg-gradient-to-r from-green-400 to-blue-500 flex justify-center items-center max-h-auto'>
                    <div className='bg-slate-800 h-full w-full rounded-md p-1 max-h-auto'>
                        <div className='flex justify-between items-center'>
                            <h1>Bio</h1>
                            <span className='cursor-pointer'
                                onClick={() => { setIsBio(true) }}>
                                <Ellipsis />
                            </span>
                        </div>
                        <Seemore text={user.bio} range={150}/>
                    </div>
                </div>
            </div>
            <div className='relative md:p-4'>
                <h1 className='capitalize md:text-4xl font-bold'>your post</h1>
                <br />
                <br />
                <Mypost />
            </div>
        </section>
    )
}

export default Profile;