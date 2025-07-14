import React from 'react'
import colors from "./color";

const Style = () => {
    return (
        <div className='flex flex-wrap-reverse gap-1 bg-slate-800'>{
            colors.map((color, idx) => (
                <div className={`w-14 h-14 ${color} rounded-md border hover:scale-110`}></div>
            ))
        }</div>
    )
}

export default Style