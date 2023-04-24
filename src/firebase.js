import firebase from "firebase/compat/app";
import "firebase/compat/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCyp2p9rqqjociX0e9H0WU2axqrJ3xeaOA",
  authDomain: "fir-rtc-aa529.firebaseapp.com",
  projectId: "fir-rtc-aa529",
  storageBucket: "fir-rtc-aa529.appspot.com",
  messagingSenderId: "369100992516",
  appId: "1:369100992516:web:61a4dca4e4d595a5010551",
  measurementId: "G-XETK00RSN9",
};

export const app = firebase.initializeApp(firebaseConfig);
export const firestore = firebase.firestore();
