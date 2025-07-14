import React from 'react'

const ToggleBtn = ({condition}) => {
    return (
        <div className={`w-12 h-5 rounded-xl cursor-pointer border bg-blue-600 flex ${condition ? "justify-end": "justify-start"} items-center p-[3px] duration-300`}><div className='w-4 h-4 rounded-lg bg-white'></div></div>
    )
}

export default ToggleBtn;
