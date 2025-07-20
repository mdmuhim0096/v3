import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, remove, push, onChildAdded } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyB3-LW70CnKpUpkcnbTuLmX2lpheHrPliI",
  authDomain: "contact-form-2-405610.firebaseapp.com",
  projectId: "contact-form-2-405610",
  storageBucket: "contact-form-2-405610.appspot.com",
  messagingSenderId: "200076844672",
  appId: "1:200076844672:web:daf2b3178791665e88d065",
  measurementId: "G-M7MNNC029J"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database, ref, set, onValue, remove, push, onChildAdded };
