import React, { useEffect, useState } from 'react'
import gsap from "gsap"
import axios from "axios"
import { Link, useNavigate } from "react-router-dom";
import { Leaf } from "lucide-react";
import { server_port } from './api';
const Signup = () => {
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPass] = useState('');
    const [gender, setGender] = useState('');
    const [image, setImage] = useState(null);
    const navigate = useNavigate();
    const signup = () => {
        if (name.trim() && age.trim() && email.trim() && password.trim() && gender.trim() && image) {
            localStorage.setItem("auth", true);
        } else { return }

        const fd = new FormData();
        fd.append("name", name)
        fd.append("email", email)
        fd.append("age", age)
        fd.append("pass", password)
        fd.append("img", image)
        fd.append("gender", gender)
        axios.post(server_port + "/api/people/signup", fd, { withCredentials: true });
        setTimeout(() => { navigate("/") }, 500);
    }
    return (
        <div className="w-full h-full flex justify-center items-center text-white">
            <div className="md:w-7/12 w-full md:p-0 px-4 overflow-hidden relative flex justify-center items-center h-screen" >
                <form onSubmit={signup}>
                    <div className='text-center mb-3'><h3 className="bg-gradient-to-r text-3xl from-indigo-500 via-teal-400 to-blue-600 inline-block text-transparent bg-clip-text font-bold drop-shadow-xl capitalize">signup</h3></div>
                    <input type="text" placeholder="name" required onChange={(e) => { setName(e.target.value) }} value={name} />
                    <input type="email" placeholder="email" required onChange={(e) => { setEmail(e.target.value) }} value={email} />
                    <input type="number" placeholder="enter your age" required onChange={(e) => { setAge(e.target.value) }} value={age} />
                    <input type="password" placeholder="password" required onChange={(e) => { setPass(e.target.value) }} value={password} />
                    <input type="file" required id="file" onChange={(e) => { setImage(e.target.files[0]) }} />
                    <div className="w-full flex items-center gap-5 my-3">
                        <div className="flex items-center gap-2">
                            <input className="gender" id="female" name="gender" type="radio" value="female" required onClick={(e) => { setGender(e.target.value) }} />
                            <label htmlFor='female'>female</label>
                        </div>
                        <div className="flex items-center gap-2">
                            <input className="gender" id="male" name="gender" type="radio" value="male" required onClick={(e) => { setGender(e.target.value) }} />
                            <label htmlFor="male">male</label>
                        </div>
                    </div>
                    <div className='flex justify-between items-center'>
                        <div className='px-4 rounded-md bg-blue-600 py-1 flex items-center duration-150 gap-3 hover:gap-20 cursor-pointer' onClick={() => { signup() }}>Signup<Leaf /></div>
                        <span>if need to <span className='underline text-blue'><Link to={"/login"}>Login</Link></span></span>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default Signup