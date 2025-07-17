import React, { useEffect, useRef, useState } from 'react';

const save = (time) => {
    localStorage.setItem("callduration", time);
};

const Timer = ({ isCallActive }) => {
    const [time, setTime] = useState(0); // seconds
    const timerRef = useRef(null);

    useEffect(() => {
        if (isCallActive) {
            timerRef.current = setInterval(() => {
                setTime(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(timerRef.current);
            setTime(0); // Reset if needed
        }

        return () => clearInterval(timerRef.current);
    }, [isCallActive]);

    useEffect(() => {
        // Save to localStorage every time time updates
        if (isCallActive) {
            save(formatTime(time));
        }
    }, [time, isCallActive]);

    const formatTime = (totalSeconds) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return `${hours}h ${minutes}m ${seconds}s`;
    };

    return (
        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
            {formatTime(time)}
           
        </div>
    );
};

export default Timer;

