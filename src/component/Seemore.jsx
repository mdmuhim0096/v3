import React, { useEffect, useState } from 'react'

const Seemore = ({ text = [], range }) => {
    const [isSeMore, setSeeMore] = useState(true);
    const length = text.length;
    const sensitiveText = text.slice(0, range);
    return (
        <div>
            <p className='text-indigo-200'>{length <= range ? text : <p>{isSeMore ? sensitiveText : text}<span onClick={() => {
                setSeeMore(isSeMore ? false : true);
            }} className='underline px-2 cursor-pointer text-gray-400'>{isSeMore ? "semore" : "seless"}</span></p>}</p>
        </div>
    )
}

export default Seemore;