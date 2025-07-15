import io from "socket.io-client";
import { server_port } from "./api";
const socket = io(server_port, {
    transports: ["websocket"],
    withCredentials: true
});
export default socket;