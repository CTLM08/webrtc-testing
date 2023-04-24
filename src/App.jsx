import React, { useEffect, useRef, useState } from "react";
import { v4 } from "uuid";
import {
  doc,
  collection,
  setDoc,
  addDoc,
  onSnapshot,
  getDoc,
  updateDoc,
} from "@firebase/firestore";
import { firestore } from "./firebase";

//rtc
const servers = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
  iceCandidatePoolSize: 10,
};

let pc = new RTCPeerConnection(servers);

const App = () => {
  const webcamVideo = useRef();
  const remoteVideo = useRef();
  const [callId, setCallId] = useState("");
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  useEffect(() => {
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });

      webcamVideo.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream) {
      remoteVideo.current.srcObject = remoteStream;

      pc.ontrack = (e) => {
        e.streams[0].getTracks().forEach((track) => {
          remoteStream.addTrack(track);
        });
      };
    }
  }, [remoteStream]);

  const openWebcam = async () => {
    const _localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    setLocalStream(_localStream);

    const _remoteStream = new MediaStream();
    setRemoteStream(_remoteStream);
  };

  const createCall = async () => {
    const id = v4();
    console.log(id);
    const callDoc = doc(firestore, "calls", id);
    const offerCandidates = collection(callDoc, "offerCandidates");
    const answerCandidates = collection(callDoc, "answerCandidates");

    const offerDescription = await pc.createOffer();
    await pc.setLocalDescription(offerDescription);
    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };
    await setDoc(callDoc, { offer });
    onSnapshot(callDoc, (snapshot) => {
      const data = snapshot.data();
      if (!pc.currentRemoteDescription && data?.answer) {
        const answerDescription = new RTCSessionDescription(data.answer);
        pc.setRemoteDescription(answerDescription);
      }
    });
    onSnapshot(answerCandidates, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const candidate = new RTCIceCandidate(change.doc.data());
          pc.addIceCandidate(candidate);
        }
      });
    });
    console.log("sus");
    pc.onicecandidate = (event) => {
      event.candidate && addDoc(offerCandidates, event.candidate.toJSON());
      console.log(event.candidate);
    };
  };

  const joinCall = async (callInput) => {
    const callId = callInput;
    console.log(callId);
    const callDoc = doc(firestore, "calls", callId);
    const offerCandidates = collection(callDoc, "offerCandidates");
    const answerCandidates = collection(callDoc, "answerCandidates");
    pc.onicecandidate = (event) => {
      event.candidate && addDoc(answerCandidates, event.candidate.toJSON());
    };
    const callData = (await getDoc(callDoc)).data();
    const offerDescription = callData.offer;
    await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));
    const answerDescription = await pc.createAnswer();
    await pc.setLocalDescription(answerDescription);
    const answer = {
      type: answerDescription.type,
      sdp: answerDescription.sdp,
    };
    await updateDoc(callDoc, { answer });
    onSnapshot(offerCandidates, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          let data = change.doc.data();
          pc.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });
  };

  return (
    <div>
      <button onClick={openWebcam}>open webCam</button>
      <div className="flex">
        <video ref={webcamVideo} autoPlay playsInline></video>
        <video ref={remoteVideo} autoPlay playsInline></video>
      </div>
      <div className="flex flex-col">
        <button onClick={() => createCall()}>createCall</button>
        <div>
          <input value={callId} onChange={(e) => setCallId(e.target.value)} />
          <button onClick={() => joinCall(callId)}>join call</button>
        </div>
      </div>
    </div>
  );
};

export default App;
