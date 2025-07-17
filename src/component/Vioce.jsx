// components/VoiceButton.jsx
import React, { useRef, useState } from "react";
import { Mic } from "lucide-react";

// IndexedDB Helpers
const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("VoiceAudioDB", 1);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains("audios")) {
                db.createObjectStore("audios", { keyPath: "id" });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

const saveAudioBlob = async (id, blob) => {
    const db = await openDB();
    const tx = db.transaction("audios", "readwrite");
    const store = tx.objectStore("audios");
    await store.put({ id, blob });
    await tx.complete;
    db.close();
};

const getAudioBlob = async (id) => {
    const db = await openDB();
    const tx = db.transaction("audios", "readonly");
    const store = tx.objectStore("audios");
    const result = await new Promise((res, rej) => {
        const req = store.get(id);
        req.onsuccess = () => res(req.result);
        req.onerror = () => rej(req.error);
    });
    db.close();
    return result?.blob || null;
};


export default function VoiceButton({ onAudioReady }) {
    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null);
    const audioChunks = useRef([]);
    const audioIdRef = useRef(null);
    const [isRecording, setIsRecording] = useState(false);

    const handleMouseDown = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            audioChunks.current = [];
            audioIdRef.current = `audio_${Date.now()}`;

            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.ondataavailable = (e) => {
                audioChunks.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = async () => {
                const blob = new Blob(audioChunks.current, { type: "audio/webm" });
                await saveAudioBlob(audioIdRef.current, blob);
                const storedBlob = await getAudioBlob(audioIdRef.current);

                if (typeof onAudioReady === "function" && storedBlob) {
                    onAudioReady(storedBlob);
                }

                streamRef.current.getTracks().forEach((track) => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Microphone access failed:", err);
            alert("Microphone permission required.");
        }
    };

    const handleMouseUp = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    return (
        <div onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp} className='w-12 h-10 rounded-lg bg-rose-500 flex justify-center items-center' id='mic' >
            <Mic />
        </div>
    );
}
