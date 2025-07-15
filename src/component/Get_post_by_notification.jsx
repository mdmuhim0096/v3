import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { Ellipsis, X, Share2, MessageSquareIcon, ThumbsUp, Rocket } from "lucide-react";
import Seemore from './Seemore';
import { Link } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import { server_port } from './api';
import Navbar from "./Navbar";
import ShortText from './ShortText';
import socket from './socket';

const Get_post_by_notification = () => {

    const _location_ = useLocation();
    const postId = _location_.state?.postId;

    const [posts, setPost] = useState([]);
    const [isComment, setIsComment] = useState(false);
    const [load, setLoad] = useState(0);
    const [commentOrReplay, setCommentOrReplay] = useState("");
    const [doreplay, setDoReoplay] = useState(false);
    const [commentId, setCommentId] = useState("");
    const [innerReplay, setInnerReplay] = useState(false);
    const [innerReplayId, setInnerReplayId] = useState("");

    const notify = (m) => { toast.success(m) };
    console.log(posts);
    useEffect(() => {
        try {
            const getPublicPost = async () => {
                const res = await axios.get(server_port+`/api/post/getpostbyid/${postId}`);
                setPost(Array.isArray(res.data.post) ? res.data.post : [res.data.post]);
            }
            getPublicPost();
        } catch (error) {
            console.log(error);
        }
    }, [load]);

    const [post_info, setPost_info] = useState([]);
    const [commentReplay, setCommentReplay] = useState([
        {
            "text": "hello",
            "user": "67d7a8c65a7e8be20ce47cbc",
            "_id": "67dc0b2c1f5cee2eaa24d9aa",
            "replies": []
        }
    ]);

    const [post_id, setPost_id] = useState("");

    const getPostInfo = async (id) => {
        try {
            const res = await axios.get(server_port+`/api/post/postinfo/${id}`);
            setPost_info(res.data.singlePost);
            setCommentReplay(res.data.singlePost.comments)
            console.log(res.data.singlePost.comments);
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        getPostInfo(post_id);
    }, [post_id], load)

    const doLike = (postId) => {
        axios.post(server_port + "/api/post/addlike", { postId }, { withCredentials: true })
    }

    const addComment = () => {
        if (commentOrReplay.trim()) {
            axios.post(server_port + "/api/post/addcomment", { comment: commentOrReplay, post_id }, { withCredentials: true })
            setCommentOrReplay("")
            notify("comment added ☺")
        }
    }

    const doReplay = () => {
        if (commentOrReplay.trim()) {
            axios.post(server_port + "/api/post/addreplay", { replyText: commentOrReplay, postId: post_id, commentId }, { withCredentials: true })
        }
        setCommentOrReplay("")
        notify("replay added ☺")
    }

    const doInnerRplay = () => {
        if (commentOrReplay.trim()) {
            axios.post(server_port + "/api/post/addinnerreplay", { replyText: commentOrReplay, postId: post_id, commentId, repId: innerReplayId }, { withCredentials: true })
        }
        setCommentOrReplay("")
        notify("replay added ☺")
        setInnerReplay(false);
    }
    const [replayOf, setReplayOf] = useState("");
    const [nestedId, setNestedId] = useState("");
    const [nsetReplay, setNestReplay] = useState(false);

    const doNestedInnerReplay = () => {
        if (commentOrReplay.trim()) {
            axios.post(server_port + "/api/post/addNestedInnerReplay", { replyText: commentOrReplay, postId: post_id, commentId, repId: innerReplayId, replayOf, nestedId }, { withCredentials: true })
        }
        setCommentOrReplay("")
        notify("replay added ☺")
        setInnerReplay(false);
    }

    const addLike_comment = () => {
        axios.post(server_port + "/api/post/addlike_comment", { postId: post_id, commentId }, { withCredentials: true });
    }

    const addlike_replay = (repId, commentId) => {
        axios.post(server_port + "/api/post/addlike_replay", { postId: post_id, commentId, repId }, { withCredentials: true });
    }

    const inner_addlike_replay = (repId, commentId, nestId) => {
        axios.post(server_port + "/api/post/inner_addlike_replay", { postId: post_id, commentId, repId, nestId }, { withCredentials: true });
    }

    const inputRef = useRef();
    const focus = () => {
        inputRef.current.focus();
    }


    return (
        <div className=''>
            <Navbar />
            <ToastContainer />
            {
                Array.isArray(posts) && posts.map((data, index) => (
                    <div key={index} className={`mx-auto w-full sm:w-7/12 md:h-[88vh] lg:h-[82vh] rounded-lg border p-2 backdrop-blur-md my-5 bg-slate-900 h-[430px]`}>
                        <div className='flex justify-between items-center border-b-2 border-cyan-700 mb-3 pb-1'>
                            <div className='flex justify-between items-center gap-2'>
                                <img className='w-10 h-10 rounded-full' src={server_port + data.postOwner.image} />
                                <h4>{data.postOwner.name}</h4>
                            </div>
                        </div>
                        <div className='my-2'>
                            <Seemore text={data.caption} range={200} />
                        </div>
                        {data.image && !data.video ? <img className='rounded-md w-full max-h-96 object-fill h-[280px]  md:h-[58vh]' src={server_port + data.media} /> : <video src={server_port + data.media} controls loop className='h-[280px] w-full object-fill md:h-[58vh]'></video>}
                        <footer className='flex w-full justify-between items-end border-t h-10'>
                            <span onClick={() => {
                                doLike(data._id)
                                setLoad(load + 1);
                            }} className='post_footer w-4/12 border-e'>
                                <ThumbsUp />
                                <span>Like</span>
                                <span>{data.likes.length}</span>
                            </span>
                            <span className='post_footer w-4/12 border-e justify-center'
                                onClick={() => {
                                    setIsComment(true);
                                    setPost_id(data._id);
                                    caption = post_info.caption;
                                }}>
                                <MessageSquareIcon />
                                <span>comments</span>
                            </span>
                            <span className='post_footer w-4/12  justify-end'>
                                <Share2 />
                                <span>share</span>
                            </span>
                        </footer>
                    </div>
                ))
            }
            <div className={`w-full h-full border backdrop-blur-sm fixed top-0 left-0 flex justify-center items-center ${isComment ? "" : "hidden"} z-10`} id='commentplate'>
                <div className="w-full h-full sm:w-8/12 rounded-md border bg-teal-950 sm:h-[92vh] shadow-xl p-2">
                    <header className='flex justify-end items-center gap-3 border-b pb-1 mb-1'>
                        <span>
                            <Ellipsis />
                        </span>
                        <span onClick={() => {
                            setIsComment(false);
                        }}>
                            <X />
                        </span>
                    </header>
                    <div className='w-full h-[82vh] sm:h-[75vh] overflow-y-auto'>
                        <div className='w-full h-auto rounded-lg bg-gray-700'>
                            {post_info.image && !post_info.video ? <img className='rounded-md w-full max-h-96 object-contain' src={server_port + post_info.media} /> : <video src={server_port + post_info.media} controls loop ></video>}
                            <p className='p-2 text-teal-300'>{post_info.caption}</p>
                        </div>
                        <div className='w-full h-auto mt-2 rounded-md text-sm'>
                            {commentReplay.map((data, index) => (
                                <div key={index} className='my-2 bg-gray-700 rounded-md p-2 border-b-4'>

                                    <div className='border-s border-b w-full p-2 rounded-sm'>
                                        <div className='flex justify-start items-center gap-1'>
                                            <div className='flex justify-start items-center gap-1 cursor-pointer'>
                                                <img src={server_port + data.user.image} className='w-6 h-6 rounded-full' />
                                                <Link to={"/publicprofile"} state={{ id: data.user._id }} className='text-sm text-ellipsis font-extrabold text-sky-600 duration-200
                                hover:text-cyan-500'><ShortText text={data.user.name} width={window.innerWidth} dot={2} range={3} /></Link>
                                            </div>
                                            <span>|</span>
                                            <span className='cursor-pointer text-indigo-600 duration-200
                        hover:text-indigo-400'
                                                onClick={() => {
                                                    setCommentId(data._id);
                                                    addLike_comment();
                                                }}
                                            >like {data.likes?.length}</span>
                                            <span>|</span>
                                            <span className='cursor-pointer text-green-500 duration-200 hover:text-green-300'
                                                onClick={() => {
                                                    setCommentId(data._id);
                                                    setDoReoplay(true);
                                                    focus();
                                                }}>replay</span>
                                            <span>|</span>
                                            <span className='text-orange-600 duration-200
                        hover:text-orange-500 cursor-pointer'
                                                onClick={() => { document.getElementById(`replayPlate${index}`).style.display = "block" }}>
                                                <ShortText text={"view reply"} width={window.innerWidth} dot={2} range={4} /></span>

                                        </div>
                                        <h5 className='ml-6 mt-1'>{data.text}</h5>
                                    </div>
                                    <div className={`ml-1 sm:ml-8 mt-0 hidden`} id={`replayPlate${index}`}>{data.replies.map((rep, index) => (
                                        <div key={index} className='my-1'>
                                            <div className='p-2 border-s border-b w-full rounded-sm'>
                                                <div className='flex items-center gap-1'>

                                                    <Link to={"/publicprofile"} state={{ id: rep.user._id }} className='flex justify-start items-center gap-1 cursor-pointer'>
                                                        <img src={server_port + rep.user.image} className='w-6 h-6 rounded-full' />
                                                        <h5 className='text-sm text-ellipsis font-extrabold
                                         text-pink-600 duration-200
                                    hover:text-pink-400'><ShortText text={rep.user.name} range={8} dot={3} width={window.innerWidth} /></h5>
                                                    </Link>

                                                    <span>|</span>
                                                    <span className='cursor-pointer
                             text-blue duration-200
                            hover:text-indigo-600'
                                                        onClick={() => {
                                                            addlike_replay(rep._id, data._id);
                                                        }}
                                                    >like {rep.likes?.length}</span>
                                                    <span>|</span>
                                                    <span className='cursor-pointer text-lime-500 
                            duration-200 hover:text-lime-300'
                                                        onClick={() => {
                                                            setInnerReplay(true);
                                                            setNestReplay(false);
                                                            setInnerReplayId(rep._id);
                                                            setCommentId(data._id);
                                                            setDoReoplay(true)
                                                            focus();
                                                        }}>replay</span>
                                                </div>
                                                <h5 className='ml-6 mt-1'>{rep.text}</h5>
                                            </div>
                                            <div>{rep.replay.map((innerRep, index) => (
                                                <div key={index} className='border-s border-b ml-1 sm:ml-8 p-2 rounded-sm'>
                                                    <div className='flex justify-start items-center gap-1 cursor-pointer'>
                                                        <Link to={"/publicprofile"} state={{ id: innerRep.user._id }}
                                                            className='flex justify-start items-center gap-1'>
                                                            <img src={server_port + innerRep.user.image} className='w-6 h-6 rounded-full' />
                                                            <h5 className='text-sm text-ellipsis font-extrabold
                                                                text-pink-600 duration-200
                                                            hover:text-pink-400'
                                                            >
                                                                <ShortText text={innerRep.user.name} range={8} dot={3} width={window.innerWidth} /></h5>
                                                        </Link>
                                                        <span>|</span>
                                                        <span className='cursor-pointer
                                                                        text-blue duration-200
                                                                        hover:text-indigo-600'
                                                            onClick={() => {
                                                                inner_addlike_replay(rep._id, data._id, innerRep._id);
                                                            }}
                                                        >like {innerRep.likes?.length}</span>
                                                        <span>|</span>
                                                        <span className='cursor-pointer text-lime-500 
                                                                                duration-200 hover:text-lime-300'
                                                            onClick={() => {
                                                                setInnerReplay(false);
                                                                setNestReplay(true);
                                                                setNestedId(innerRep._id);
                                                                setReplayOf(innerRep.text);
                                                                setCommentId(data._id);
                                                                setInnerReplayId(rep._id);
                                                                setDoReoplay(true);
                                                                focus();
                                                            }}>replay</span>
                                                    </div>
                                                    <h5 className='ml-6 mt-1'>{innerRep.text}</h5>
                                                    <div className=''>{innerRep.replay.map((nest, index) => (<div key={index} >
                                                        <hr />
                                                        <div className='ml-1 sm:ml-6 mt-1 flex flex-wrap justify-start items-center'>

                                                            <span className='italic text-sky-500 pr-2'>reply of</span>
                                                            <span>[{nest.replayOf}]</span>
                                                            <Link to={"/publicprofile"} state={{ id: nest.user._id }} className='flex items-center px-2 cursor-pointer hover:underline hover:text-sky-500'>
                                                                <img className='w-4 h-4 rounded-full' src={server_port + nest.user.image} />
                                                                <span className='px-1 text-xs'>{nest.user.name}</span>
                                                            </Link>
                                                            <span className='px-1 text-orange-400'>{nest.user.gender === "male" ? `his reply is:-` : `shis reply is:-`}</span>
                                                            <span className='underline animate-pulse'>{nest.text}</span>
                                                            <span className='cursor-pointer text-lime-500 px-2
                                                                                    duration-200 hover:text-lime-300'
                                                                onClick={() => {
                                                                    setInnerReplay(false);
                                                                    setNestReplay(true);
                                                                    setNestedId(innerRep._id);
                                                                    setReplayOf(nest.text);
                                                                    setCommentId(data._id);
                                                                    setInnerReplayId(rep._id);
                                                                    setDoReoplay(true);
                                                                    focus();
                                                                }}>replay</span>
                                                        </div>
                                                    </div>))}</div>
                                                </div>
                                            ))}</div>
                                        </div>
                                    ))}
                                    </div>

                                </div>
                            ))}
                        </div>
                    </div>
                    <div className='flex justify-between items-center gap-1'>
                        <input
                            type="text"
                            placeholder={`write ${doreplay ? "replay" : "comment"} text`}
                            className='w-11/12 rounded-e-none p-1 placeholder:text-sm text-white'
                            onChange={(e) => { setCommentOrReplay(e.target.value) }}
                            value={commentOrReplay}
                            ref={inputRef} />
                        <div
                            className='border-none pr-3 rounded-s-none 
                                    h-auto w-16 bg-gradient-to-r from-fuchsia-500
                                 to-cyan-500 flex justify-center items-center p-1 
                                    rounded-e-lg text-white cursor-pointer'
                            onClick={() => {
                                // setLoad(load + 1);
                                if (innerReplay) {
                                    doInnerRplay();
                                     getPostInfo(post_id);
                                } else if (nsetReplay) {
                                    doNestedInnerReplay();
                                     getPostInfo(post_id);
                                } else {
                                    doreplay ? doReplay() : addComment();
                                     getPostInfo(post_id);
                                }
                                setTimeout(() => { setDoReoplay(false) }, 60);
                            }}>
                            <Rocket />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
};

export default Get_post_by_notification;