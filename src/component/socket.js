import io from "socket.io-client";
const socket = io("https://node-v1-tc13.onrender.com", {
    transports: ["websocket"],
    withCredentials: true
});
export default socket;