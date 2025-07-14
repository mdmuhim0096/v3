import axios from "axios"

export const active = () => {
    const userId = localStorage.getItem("myId");
    const doAction = () => {
        axios.post("http://localhost:4000/api/people/activeuser", { userId })
    }
    const Turn = localStorage.getItem("isTurn");
    Turn === true || Turn === "true" ? doAction() : () => { return };

};